-- =============================================================================
-- SKALA AGENCY OS — Schema de Base de Datos
-- Ejecutar en Supabase SQL Editor (en orden)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: agencies (nivel raíz)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencies (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  owner_email TEXT       NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLA: profiles (vincula auth.users con agency_id para RLS)
-- CRÍTICO: debe crearse antes que cualquier política RLS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id  UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id  UUID REFERENCES clients(id) ON DELETE SET NULL,
  role       TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'member', 'client')),
  full_name  TEXT,
  avatar_url TEXT
);

-- Crear profile automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _agency_id UUID;
  _role TEXT;
  _full_name TEXT;
BEGIN
  _agency_id := (NEW.raw_user_meta_data->>'agency_id')::UUID;
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');
  _full_name := NEW.raw_user_meta_data->>'full_name';

  INSERT INTO public.profiles (id, agency_id, role, full_name)
  VALUES (NEW.id, _agency_id, _role, _full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- -----------------------------------------------------------------------------
-- TABLA: clients
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         UUID        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  vertical          TEXT        NOT NULL, -- restaurante, clinica, barberia, gimnasio, retail, hotel
  gmb_account_id    TEXT,                 -- Google Business Profile account ID
  gmb_location_id   TEXT,                 -- Location ID específico
  phone             TEXT,                 -- número WhatsApp del negocio (Twilio)
  email             TEXT,
  domain            TEXT,                 -- dominio del cliente
  stripe_customer_id TEXT,
  active            BOOLEAN     DEFAULT true,
  config            JSONB       DEFAULT '{}', -- tokens GMB, servicios, horarios, etc.
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLA: leads (CRM)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  phone       TEXT,
  email       TEXT,
  service     TEXT,                  -- servicio de interés
  source      TEXT,                  -- whatsapp, gmb_call, web_form, referral
  status      TEXT        DEFAULT 'new', -- new, contacted, nurture, appointment, closed, cold
  nurture_day INTEGER     DEFAULT 0,    -- día actual de secuencia email
  notes       TEXT,
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at en leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- -----------------------------------------------------------------------------
-- TABLA: reviews (Google Business Profile)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gmb_review_id       TEXT        UNIQUE NOT NULL,
  author              TEXT,
  rating              INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text                TEXT,
  reply               TEXT,               -- respuesta publicada
  reply_generated_at  TIMESTAMPTZ,
  reply_published_at  TIMESTAMPTZ,
  alert_sent          BOOLEAN     DEFAULT false, -- alerta SMS enviada si rating <= 3
  raw                 JSONB,              -- data completa de GMB
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLA: workflows (automatizaciones)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflows (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  type       TEXT        NOT NULL, -- review_reply, lead_welcome, email_nurture, report, chatbot
  active     BOOLEAN     DEFAULT true,
  config     JSONB       DEFAULT '{}', -- nodes + edges del workflow builder
  runs_today INTEGER     DEFAULT 0,
  last_run   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLA: workflow_runs (log de ejecuciones)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_runs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID        REFERENCES workflows(id) ON DELETE CASCADE,
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL, -- success, error, pending
  trigger     TEXT,                 -- qué lo disparó
  output      JSONB,                -- resultado
  error       TEXT,
  tokens_used INTEGER,              -- tokens Claude si aplica
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TABLA: messages (WhatsApp / SMS / Email)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id     UUID        REFERENCES leads(id) ON DELETE SET NULL,
  direction   TEXT        NOT NULL, -- inbound, outbound
  channel     TEXT        NOT NULL, -- whatsapp, sms, email
  from_number TEXT,
  to_number   TEXT,
  body        TEXT,
  status      TEXT,                 -- sent, delivered, read, failed
  twilio_sid  TEXT,
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE agencies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;

-- Helper function: obtener agency_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
  SELECT agency_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- policies: agencies
CREATE POLICY "Agency: ver la propia" ON agencies
  FOR SELECT USING (id = get_user_agency_id());

-- policies: profiles
CREATE POLICY "Profiles: ver el propio" ON profiles
  FOR ALL USING (id = auth.uid());

-- policies: clients
CREATE POLICY "Clients: ver los propios" ON clients
  FOR ALL USING (agency_id = get_user_agency_id());

-- policies: leads
CREATE POLICY "Leads: ver los del cliente propio" ON leads
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE agency_id = get_user_agency_id()
    )
  );

-- policies: reviews
CREATE POLICY "Reviews: ver las del cliente propio" ON reviews
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE agency_id = get_user_agency_id()
    )
  );

-- policies: workflows
CREATE POLICY "Workflows: ver los del cliente propio" ON workflows
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE agency_id = get_user_agency_id()
    )
  );

-- policies: workflow_runs
CREATE POLICY "WorkflowRuns: ver los del cliente propio" ON workflow_runs
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE agency_id = get_user_agency_id()
    )
  );

-- policies: messages
CREATE POLICY "Messages: ver los del cliente propio" ON messages
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE agency_id = get_user_agency_id()
    )
  );

-- =============================================================================
-- ÍNDICES para performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_agency_id     ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id       ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status          ON leads(status);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id     ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating        ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_messages_client_id    ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id      ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_client  ON workflow_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_workflows_client_id   ON workflows(client_id);

-- =============================================================================
-- MIGRACIÓN: Agregar client_id a profiles + fix trigger handle_new_user
-- Fecha: 2026-03-30
-- Contexto: P0-002 + P1-003 de auditoría
-- =============================================================================

-- 1. Agregar client_id a profiles para soportar rol 'client'
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 2. Índice para búsquedas de perfil por agency_id
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);

-- 3. Índice para búsquedas de perfil por client_id
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);

-- 4. Índice para búsqueda de agencia por email
CREATE INDEX IF NOT EXISTS idx_agencies_owner_email ON agencies(owner_email);

-- 5. Fix trigger: manejar creación de profile con defaults razonables
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _agency_id UUID;
BEGIN
  -- Intentar obtener agency_id del metadata del usuario (si se pasó en signup)
  _agency_id := (NEW.raw_user_meta_data->>'agency_id')::UUID;

  INSERT INTO public.profiles (id, agency_id, role)
  VALUES (
    NEW.id,
    _agency_id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

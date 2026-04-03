// =============================================================================
// SKALA AGENCY OS — Tipos globales TypeScript
// =============================================================================

export interface Agency {
  id: string
  name: string
  owner_email: string
  created_at: string
}

export interface Profile {
  id: string
  agency_id: string | null
  client_id?: string | null
  role: 'owner' | 'member' | 'client'
  full_name?: string
  avatar_url?: string
}

export interface ClientConfig {
  gmb_access_token?: string
  gmb_refresh_token?: string
  gmb_token_expiry?: string
  twilio_wa_number?: string
  owner_phone?: string
  services?: string[]
  hours?: string
  phone?: string
}

export interface Client {
  id: string
  agency_id: string
  name: string
  vertical: 'restaurante' | 'clinica' | 'barberia' | 'gimnasio' | 'retail' | 'hotel'
  gmb_account_id?: string
  gmb_location_id?: string
  phone?: string
  email?: string
  domain?: string
  stripe_customer_id?: string
  wallet_balance: number
  active: boolean
  config: ClientConfig
  created_at: string
}

export interface WalletTransaction {
  id: string
  client_id: string
  amount: number
  type: 'credit' | 'debit' | 'refund'
  description: string
  reference_id: string | null
  balance_after: number
  created_by: string | null
  created_at: string
}

export type LeadStatus = 'new' | 'contacted' | 'nurture' | 'appointment' | 'closed' | 'cold'
export type LeadSource = 'whatsapp' | 'gmb_call' | 'web_form' | 'referral'

export interface Lead {
  id: string
  client_id: string
  name: string
  phone?: string
  email?: string
  service?: string
  source?: LeadSource
  status: LeadStatus
  nurture_day: number
  notes?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  client_id: string
  gmb_review_id: string
  author?: string
  rating: 1 | 2 | 3 | 4 | 5
  text?: string
  reply?: string
  reply_generated_at?: string
  reply_published_at?: string
  alert_sent: boolean
  raw?: Record<string, unknown>
  created_at: string
}

export type WorkflowType = 'review_reply' | 'lead_welcome' | 'email_nurture' | 'report' | 'chatbot'

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

export interface WorkflowConfig {
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  [key: string]: unknown
}

export interface Workflow {
  id: string
  client_id: string
  name: string
  type: WorkflowType
  active: boolean
  config: WorkflowConfig
  runs_today: number
  last_run?: string
  created_at: string
}

export type WorkflowRunStatus = 'success' | 'error' | 'pending'

export interface WorkflowRun {
  id: string
  workflow_id?: string
  client_id: string
  status: WorkflowRunStatus
  trigger?: string
  output?: Record<string, unknown>
  error?: string
  tokens_used?: number
  created_at: string
}

export type MessageDirection = 'inbound' | 'outbound'
export type MessageChannel = 'whatsapp' | 'sms' | 'email'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  client_id: string
  lead_id?: string
  direction: MessageDirection
  channel: MessageChannel
  from_number?: string
  to_number?: string
  body?: string
  status?: MessageStatus
  twilio_sid?: string
  metadata: Record<string, unknown>
  created_at: string
}

// WhatsApp bot intent detection
export type WhatsAppIntent = 'appointment' | 'inquiry' | 'complaint' | 'other'

export interface WhatsAppReplyResult {
  text: string
  intent: WhatsAppIntent
  detectedService?: string
}

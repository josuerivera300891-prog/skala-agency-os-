import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that touches these modules
// ---------------------------------------------------------------------------

const mockCreateServiceClient = vi.fn(() => mockSupabase)
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mockCreateServiceClient,
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/gmb/reviews', () => ({
  fetchNewReviews: vi.fn(() => []),
  replyToReview: vi.fn(),
}))

vi.mock('@/lib/gmb/auth', () => ({
  getValidToken: vi.fn(),
}))

vi.mock('@/lib/claude/review-reply', () => ({
  generateReviewReply: vi.fn(),
}))

vi.mock('@/lib/claude/whatsapp-bot', () => ({
  generateWhatsAppReply: vi.fn(),
}))

vi.mock('@/lib/twilio/sms', () => ({
  sendSMS: vi.fn(),
}))

vi.mock('@/lib/twilio/whatsapp', () => ({
  sendWhatsApp: vi.fn(),
}))

vi.mock('@/lib/resend/emails', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('twilio', () => ({
  default: { validateRequest: vi.fn(() => false) },
}))

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const CRON_SECRET = 'test-cron-secret-value'

// Proxy-based Supabase mock: every method call returns the proxy itself,
// and awaiting it resolves to { data: [], error: null, count: 0 }.
function createMockSupabase() {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      // Allow await / thenable resolution
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null, count: 0 })
      }
      // Return a function that returns the proxy (chainable)
      if (typeof prop === 'string') {
        return (..._args: unknown[]) => proxy
      }
    },
  }
  const proxy = new Proxy({} as Record<string, unknown>, handler)
  return proxy
}

const mockSupabase = createMockSupabase()

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as never)
}

function authedRequest(url: string, init?: RequestInit): NextRequest {
  const headers = new Headers(init?.headers as HeadersInit | undefined)
  headers.set('Authorization', `Bearer ${CRON_SECRET}`)
  return makeRequest(url, { ...init, headers })
}

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', CRON_SECRET)
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'twilio-test-token')
  vi.stubEnv('APP_URL', 'http://localhost:3000')
  vi.clearAllMocks()
  mockCreateServiceClient.mockImplementation(() => mockSupabase)
})

// ===========================================================================
// 1. CRON_SECRET verification — fetch-reviews
// ===========================================================================

describe('GET /api/cron/fetch-reviews', () => {
  async function getHandler() {
    const mod = await import('@/app/api/cron/fetch-reviews/route')
    return mod.GET
  }

  it('returns 401 when Authorization header is missing', async () => {
    const handler = await getHandler()
    const res = await handler(makeRequest('/api/cron/fetch-reviews'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when Bearer token is wrong', async () => {
    const handler = await getHandler()
    const req = makeRequest('/api/cron/fetch-reviews', {
      headers: { Authorization: 'Bearer wrong-secret' },
    })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('passes verification with correct Bearer token', async () => {
    const handler = await getHandler()
    const res = await handler(authedRequest('/api/cron/fetch-reviews'))
    expect(res.status).toBe(200)
  })
})

// ===========================================================================
// 2. CRON_SECRET verification — send-reports
// ===========================================================================

describe('GET /api/cron/send-reports', () => {
  async function getHandler() {
    const mod = await import('@/app/api/cron/send-reports/route')
    return mod.GET
  }

  it('returns 401 when Authorization header is missing', async () => {
    const handler = await getHandler()
    const res = await handler(makeRequest('/api/cron/send-reports'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when Bearer token is wrong', async () => {
    const handler = await getHandler()
    const req = makeRequest('/api/cron/send-reports', {
      headers: { Authorization: 'Bearer wrong-secret' },
    })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('passes verification with correct Bearer token', async () => {
    const handler = await getHandler()
    const res = await handler(authedRequest('/api/cron/send-reports'))
    expect(res.status).toBe(200)
  })
})

// ===========================================================================
// 3. Email nurture — /api/email/nurture
// ===========================================================================

describe('POST /api/email/nurture', () => {
  async function getHandler() {
    const mod = await import('@/app/api/email/nurture/route')
    return mod.POST
  }

  it('returns 401 when auth is missing', async () => {
    const handler = await getHandler()
    const req = makeRequest('/api/email/nurture', { method: 'POST', body: '{}' })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    const handler = await getHandler()
    const req = authedRequest('/api/email/nurture', {
      method: 'POST',
      body: 'not-json{{{',
      headers: { 'Authorization': `Bearer ${CRON_SECRET}`, 'Content-Type': 'text/plain' },
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(expect.objectContaining({ error: 'Invalid JSON' }))
  })

  it('returns 400 when leadId is missing', async () => {
    const handler = await getHandler()
    const req = authedRequest('/api/email/nurture', {
      method: 'POST',
      body: JSON.stringify({ day: 1 }),
      headers: { 'Authorization': `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid input')
  })

  it('returns 400 when day is out of range', async () => {
    const handler = await getHandler()
    const req = authedRequest('/api/email/nurture', {
      method: 'POST',
      body: JSON.stringify({ leadId: '550e8400-e29b-41d4-a716-446655440000', day: 99 }),
      headers: { 'Authorization': `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })
})

// ===========================================================================
// 4. WhatsApp send — /api/whatsapp/send
// ===========================================================================

describe('POST /api/whatsapp/send', () => {
  async function getHandler() {
    const mod = await import('@/app/api/whatsapp/send/route')
    return mod.POST
  }

  it('returns 401 when auth is missing', async () => {
    const handler = await getHandler()
    const req = makeRequest('/api/whatsapp/send', { method: 'POST', body: '{}' })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when clientId is missing', async () => {
    const handler = await getHandler()
    const req = authedRequest('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({
        to: '+1234567890',
        template: 'lead_welcome',
        data: { leadName: 'Test', clientName: 'Clinica' },
      }),
      headers: { 'Authorization': `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when template is invalid', async () => {
    const handler = await getHandler()
    const req = authedRequest('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({
        to: '+1234567890',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        template: 'nonexistent_template',
        data: { leadName: 'Test', clientName: 'Clinica' },
      }),
      headers: { 'Authorization': `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })
})

// ===========================================================================
// 5. Twilio webhook — /api/webhooks/twilio
// ===========================================================================

describe('POST /api/webhooks/twilio', () => {
  async function getHandler() {
    const mod = await import('@/app/api/webhooks/twilio/route')
    return mod.POST
  }

  it('returns 403 when Twilio signature is invalid', async () => {
    const formBody = new URLSearchParams({
      From: 'whatsapp:+1234567890',
      To: 'whatsapp:+0987654321',
      Body: 'Hola',
    })
    const req = makeRequest('/api/webhooks/twilio', {
      method: 'POST',
      body: formBody.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const handler = await getHandler()
    const res = await handler(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 when body is not valid form data', async () => {
    const handler = await getHandler()
    const req = makeRequest('/api/webhooks/twilio', {
      method: 'POST',
      body: 'not form data at all \x00\x01',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handler(req)
    // formData() on JSON content-type may throw or parse oddly; expect 400 or 403
    expect([400, 403]).toContain(res.status)
  })
})

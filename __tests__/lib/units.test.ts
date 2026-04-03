import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock logger to prevent console noise and to avoid import side-effects
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock resend SDK
const mockSend = vi.fn()
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend }
    },
  }
})

// Mock twilio SDK
const mockCreate = vi.fn()
vi.mock('twilio', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ---------------------------------------------------------------------------
// 1. OpenRouter helper
// ---------------------------------------------------------------------------

describe('lib/ai/openrouter', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key-123'
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    delete process.env.OPENROUTER_API_KEY
  })

  it('throws if OPENROUTER_API_KEY is not set', async () => {
    delete process.env.OPENROUTER_API_KEY
    const { chatCompletion } = await import('@/lib/ai/openrouter')

    await expect(
      chatCompletion({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow('OPENROUTER_API_KEY not configured')
  })

  it('calls fetch with correct headers and body', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'hello' } }],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
      }),
    }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    // Re-import to pick up the mocked env
    const mod = await import('@/lib/ai/openrouter')
    await mod.chatCompletion({ messages: [{ role: 'user', content: 'test' }] })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key-123',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('parses response text and token count', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'parsed reply' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const mod = await import('@/lib/ai/openrouter')
    const result = await mod.chatCompletion({ messages: [{ role: 'user', content: 'q' }] })

    expect(result).toEqual({ text: 'parsed reply', tokensUsed: 15 })
  })

  it('throws on non-ok response', async () => {
    const mockResponse = { ok: false, status: 429, text: async () => 'rate limited' }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const mod = await import('@/lib/ai/openrouter')
    await expect(
      mod.chatCompletion({ messages: [{ role: 'user', content: 'x' }] })
    ).rejects.toThrow('OpenRouter API error: 429')
  })
})

// ---------------------------------------------------------------------------
// 2. Resend emails
// ---------------------------------------------------------------------------

describe('lib/resend/emails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-resend-key'
    mockSend.mockResolvedValue({ data: { id: 'email-ok' } })
  })

  it('sendEmail calls Resend with lead_welcome template', async () => {
    const { sendEmail } = await import('@/lib/resend/emails')

    const ok = await sendEmail({
      to: 'lead@example.com',
      template: 'lead_welcome',
      data: { leadName: 'Ana', clientName: 'Clinica Vital', service: 'Limpieza dental' },
    })

    expect(ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'lead@example.com',
        subject: expect.stringContaining('Ana'),
      }),
    )
  })

  it('sendEmail calls Resend with nurture_day_2 template', async () => {
    const { sendEmail } = await import('@/lib/resend/emails')

    const ok = await sendEmail({
      to: 'lead@example.com',
      template: 'nurture_day_2',
      data: { leadName: 'Carlos', clientName: 'Clinica Vital' },
    })

    expect(ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Clinica Vital'),
      }),
    )
  })

  it('sendEmail calls Resend with nurture_day_3 template', async () => {
    const { sendEmail } = await import('@/lib/resend/emails')

    const ok = await sendEmail({
      to: 'lead@example.com',
      template: 'nurture_day_3',
      data: { leadName: 'Maria', clientName: 'Clinica Vital' },
    })

    expect(ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Testimonio'),
      }),
    )
  })

  it('sendEmail calls Resend with nurture_day_7 template', async () => {
    const { sendEmail } = await import('@/lib/resend/emails')

    const ok = await sendEmail({
      to: 'lead@example.com',
      template: 'nurture_day_7',
      data: { leadName: 'Pedro', clientName: 'Clinica Vital', service: 'Botox' },
    })

    expect(ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('oportunidad'),
      }),
    )
  })

  it('sendEmail calls Resend with weekly_report template', async () => {
    const { sendEmail } = await import('@/lib/resend/emails')

    const ok = await sendEmail({
      to: 'owner@clinic.com',
      template: 'weekly_report',
      data: { clientName: 'Clinica Vital', reportUrl: 'https://app.skala.com/r/1' },
    })

    expect(ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Reporte semanal'),
        html: expect.stringContaining('https://app.skala.com/r/1'),
      }),
    )
  })

  it('sendEmail returns false on Resend error', async () => {
    mockSend.mockRejectedValue(new Error('API down'))
    const { sendEmail } = await import('@/lib/resend/emails')

    const ok = await sendEmail({
      to: 'fail@example.com',
      template: 'lead_welcome',
      data: { leadName: 'Test', clientName: 'Test Co' },
    })

    expect(ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. Logger
// ---------------------------------------------------------------------------

describe('lib/logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // We need the real logger for these tests, so import directly
    vi.resetModules()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('logger.info outputs JSON with level "info"', async () => {
    // Import the real module (not the mock)
    vi.doUnmock('@/lib/logger')
    const { logger } = await import('@/lib/logger')

    logger.info('[Test] Hello', { foo: 'bar' })

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(output.level).toBe('info')
    expect(output.message).toBe('[Test] Hello')
    expect(output.foo).toBe('bar')
    expect(output.timestamp).toBeDefined()
  })

  it('logger.error outputs JSON with level "error"', async () => {
    vi.doUnmock('@/lib/logger')
    const { logger } = await import('@/lib/logger')

    logger.error('[Test] Fail', { code: 500 })

    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(output.level).toBe('error')
    expect(output.code).toBe(500)
  })

  it('logger.debug is suppressed in production', async () => {
    vi.doUnmock('@/lib/logger')

    vi.stubEnv('NODE_ENV', 'production')

    const { logger } = await import('@/lib/logger')
    logger.debug('[Test] Should not appear')

    expect(consoleSpy).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('logger.debug outputs in non-production', async () => {
    vi.doUnmock('@/lib/logger')

    vi.stubEnv('NODE_ENV', 'development')

    const { logger } = await import('@/lib/logger')
    logger.debug('[Test] Debug visible')

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
    expect(output.level).toBe('debug')
    vi.unstubAllEnvs()
  })
})

// ---------------------------------------------------------------------------
// 4. Twilio WhatsApp
// ---------------------------------------------------------------------------

describe('lib/twilio/whatsapp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TWILIO_ACCOUNT_SID = 'AC_test'
    process.env.TWILIO_AUTH_TOKEN = 'token_test'
  })

  it('sendWhatsApp calls twilio messages.create with correct params', async () => {
    mockCreate.mockResolvedValue({ sid: 'SM123' })
    const { sendWhatsApp } = await import('@/lib/twilio/whatsapp')

    const result = await sendWhatsApp({
      to: 'whatsapp:+13051234567',
      from: 'whatsapp:+14151234567',
      body: 'Hola!',
    })

    expect(result).toEqual({ sid: 'SM123' })
    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14151234567',
      to: 'whatsapp:+13051234567',
      body: 'Hola!',
    })
  })

  it('sendWhatsApp returns null on error', async () => {
    mockCreate.mockRejectedValue(new Error('Twilio down'))
    const { sendWhatsApp } = await import('@/lib/twilio/whatsapp')

    const result = await sendWhatsApp({
      to: 'whatsapp:+13050000000',
      from: 'whatsapp:+14150000000',
      body: 'fail',
    })

    expect(result).toBeNull()
  })
})

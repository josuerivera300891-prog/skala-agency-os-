import { logger } from '@/lib/logger'

// =============================================================================
// Cloudflare Registrar + DNS API helper
// Env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
// =============================================================================

const CF_BASE = 'https://api.cloudflare.com/client/v4'

function getConfig() {
  const token = process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN not configured')
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not configured')
  return { token, accountId }
}

function headers(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloudflareResult<T> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: Array<{ code: number; message: string }>
  result: T
}

export interface DomainAvailability {
  domain: string
  available: boolean
  premium: boolean
  price?: number
  currency?: string
}

export interface RegisteredDomain {
  id: string
  domain_name: string
  status: string
  expires_at: string
  auto_renew: boolean
  locked: boolean
  created_at: string
  updated_at: string
}

export interface DomainDetail extends RegisteredDomain {
  name_servers: string[]
  registrant_contact?: Record<string, unknown>
}

export interface DnsRecord {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
  ttl: number
  created_on: string
  modified_on: string
}

export interface NewDnsRecord {
  type: string
  name: string
  content: string
  proxied?: boolean
  ttl?: number
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper
// ---------------------------------------------------------------------------

async function cfFetch<T>(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<CloudflareResult<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers(token),
      ...(options.headers as Record<string, string> | undefined),
    },
  })

  const data = (await res.json()) as CloudflareResult<T>

  if (!res.ok || !data.success) {
    const errMsg = data.errors?.map((e) => e.message).join(', ') || `HTTP ${res.status}`
    logger.error('[Cloudflare] API error', { url, status: res.status, errors: data.errors })
    throw new Error(`Cloudflare API error: ${errMsg}`)
  }

  return data
}

// ---------------------------------------------------------------------------
// Domain search / availability check
// ---------------------------------------------------------------------------

const DEFAULT_TLDS = ['.com', '.net', '.org', '.io', '.co', '.app']

/**
 * Check availability and pricing for a domain across common TLDs.
 * @param query - bare domain name or full domain (e.g. "mydomain" or "mydomain.com")
 */
export async function searchDomains(query: string): Promise<DomainAvailability[]> {
  const { token, accountId } = getConfig()

  // Build list of domains to check
  const hasTld = query.includes('.')
  const domains = hasTld
    ? [query]
    : DEFAULT_TLDS.map((tld) => `${query}${tld}`)

  logger.info('[Cloudflare] Checking domain availability', { domains })

  const data = await cfFetch<DomainAvailability[]>(
    `${CF_BASE}/accounts/${accountId}/registrar/domains/check`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ domains }),
    },
  )

  return data.result
}

// ---------------------------------------------------------------------------
// Register (purchase) a domain
// ---------------------------------------------------------------------------

export async function registerDomain(
  domain: string,
  autoRenew = true,
): Promise<RegisteredDomain> {
  const { token, accountId } = getConfig()

  logger.info('[Cloudflare] Registering domain', { domain, autoRenew })

  const data = await cfFetch<RegisteredDomain>(
    `${CF_BASE}/accounts/${accountId}/registrar/domains/${domain}/register`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ auto_renew: autoRenew }),
    },
  )

  logger.info('[Cloudflare] Domain registered', { domain })
  return data.result
}

// ---------------------------------------------------------------------------
// List all registered domains
// ---------------------------------------------------------------------------

export async function listDomains(): Promise<RegisteredDomain[]> {
  const { token, accountId } = getConfig()

  logger.debug('[Cloudflare] Listing domains')

  const data = await cfFetch<RegisteredDomain[]>(
    `${CF_BASE}/accounts/${accountId}/registrar/domains`,
    token,
  )

  return data.result
}

// ---------------------------------------------------------------------------
// Get domain detail
// ---------------------------------------------------------------------------

export async function getDomainDetail(domain: string): Promise<DomainDetail> {
  const { token, accountId } = getConfig()

  const data = await cfFetch<DomainDetail>(
    `${CF_BASE}/accounts/${accountId}/registrar/domains/${domain}`,
    token,
  )

  return data.result
}

// ---------------------------------------------------------------------------
// DNS — List records for a zone
// ---------------------------------------------------------------------------

export async function listDnsRecords(zoneId: string): Promise<DnsRecord[]> {
  const { token } = getConfig()

  const data = await cfFetch<DnsRecord[]>(
    `${CF_BASE}/zones/${zoneId}/dns_records`,
    token,
  )

  return data.result
}

// ---------------------------------------------------------------------------
// DNS — Add a record
// ---------------------------------------------------------------------------

export async function addDnsRecord(
  zoneId: string,
  record: NewDnsRecord,
): Promise<DnsRecord> {
  const { token } = getConfig()

  logger.info('[Cloudflare] Adding DNS record', { zoneId, type: record.type, name: record.name })

  const data = await cfFetch<DnsRecord>(
    `${CF_BASE}/zones/${zoneId}/dns_records`,
    token,
    {
      method: 'POST',
      body: JSON.stringify(record),
    },
  )

  return data.result
}

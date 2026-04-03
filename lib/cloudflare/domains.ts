import { logger } from '@/lib/logger'

// =============================================================================
// Cloudflare Registrar + DNS API helper
// Env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
// =============================================================================

const CF_BASE = 'https://api.cloudflare.com/client/v4'

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiKey = process.env.CLOUDFLARE_API_KEY
  const email = process.env.CLOUDFLARE_EMAIL
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID not configured')
  if (!apiKey || !email) throw new Error('CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL not configured')
  return { apiKey, email, accountId }
}

function authHeaders(apiKey: string, email: string): HeadersInit {
  return {
    'X-Auth-Key': apiKey,
    'X-Auth-Email': email,
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
  apiKey: string,
  email: string,
  options: RequestInit = {},
): Promise<CloudflareResult<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(apiKey, email),
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

// RDAP only reliably works for .com and .net via Verisign
const RDAP_SERVER = 'https://rdap.verisign.com/com/v1'

// Approximate yearly prices (Cloudflare at-cost pricing)
const TLD_PRICES: Record<string, number> = {
  com: 9.77, net: 10.77, org: 10.11, io: 33.98, co: 11.50,
}

// Prefixes and suffixes to generate domain suggestions (like GHL)
const PREFIXES = ['', 'get', 'my', 'the', 'go', 'try']
const SUFFIXES = ['', 'app', 'hq', 'online', 'site', 'now', 'pro', 'hub']

function generateSuggestions(base: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '')
  const suggestions = new Set<string>()

  // Exact match first
  suggestions.add(`${clean}.com`)
  suggestions.add(`${clean}.net`)
  suggestions.add(`${clean}.org`)
  suggestions.add(`${clean}.co`)

  // Variations with prefixes/suffixes (.com only for speed)
  for (const prefix of PREFIXES) {
    for (const suffix of SUFFIXES) {
      if (!prefix && !suffix) continue // skip bare (already added)
      const name = `${prefix}${clean}${suffix}`
      if (name.length >= 3 && name.length <= 63) {
        suggestions.add(`${name}.com`)
      }
    }
  }

  return Array.from(suggestions).slice(0, 20) // max 20 to keep fast
}

/**
 * Check availability for domain suggestions using RDAP.
 * Generates variations like GHL (getskala.com, skalahq.com, etc.)
 */
export async function searchDomains(query: string): Promise<DomainAvailability[]> {
  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9.-]/g, '')
  const hasTld = cleanQuery.includes('.')
  const domains = hasTld ? [cleanQuery] : generateSuggestions(cleanQuery)

  logger.info('[Domains] Checking availability via RDAP', { count: domains.length })

  const results = await Promise.all(
    domains.map(async (domain): Promise<DomainAvailability> => {
      const tld = domain.split('.').pop() ?? 'com'
      const rdapUrl = tld === 'net'
        ? `https://rdap.verisign.com/net/v1/domain/${domain}`
        : tld === 'com'
          ? `${RDAP_SERVER}/domain/${domain}`
          : null

      // For non .com/.net TLDs, just include them as suggestions without live check
      if (!rdapUrl) {
        return {
          domain,
          available: true, // optimistic — will fail at registration if taken
          premium: false,
          price: TLD_PRICES[tld],
          currency: 'USD',
        }
      }

      try {
        const res = await fetch(rdapUrl, {
          signal: AbortSignal.timeout(4000),
        })
        return {
          domain,
          available: res.status === 404,
          premium: false,
          price: TLD_PRICES[tld],
          currency: 'USD',
        }
      } catch {
        return { domain, available: false, premium: false }
      }
    })
  )

  // Sort: available first, then by price
  return results.sort((a, b) => {
    if (a.available && !b.available) return -1
    if (!a.available && b.available) return 1
    return (a.price ?? 99) - (b.price ?? 99)
  })
}

// ---------------------------------------------------------------------------
// Register (purchase) a domain
// ---------------------------------------------------------------------------

export async function registerDomain(
  domain: string,
  autoRenew = true,
): Promise<RegisteredDomain> {
  const { apiKey, email, accountId } = getConfig()

  logger.info('[Cloudflare] Registering domain', { domain, autoRenew })

  const data = await cfFetch<RegisteredDomain>(
    `${CF_BASE}/accounts/${accountId}/registrar/domains/${domain}/register`,
    apiKey, email,
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
  const { apiKey, email, accountId } = getConfig()

  logger.debug('[Cloudflare] Listing domains')

  const data = await cfFetch<RegisteredDomain[]>(
    `${CF_BASE}/accounts/${accountId}/registrar/domains`,
    apiKey, email,
  )

  return data.result
}

// ---------------------------------------------------------------------------
// Get domain detail
// ---------------------------------------------------------------------------

export async function getDomainDetail(domain: string): Promise<DomainDetail> {
  const { apiKey, email, accountId } = getConfig()

  const data = await cfFetch<DomainDetail>(
    `${CF_BASE}/accounts/${accountId}/registrar/domains/${domain}`,
    apiKey, email,
  )

  return data.result
}

// ---------------------------------------------------------------------------
// DNS — List records for a zone
// ---------------------------------------------------------------------------

export async function listDnsRecords(zoneId: string): Promise<DnsRecord[]> {
  const { apiKey, email } = getConfig()

  const data = await cfFetch<DnsRecord[]>(
    `${CF_BASE}/zones/${zoneId}/dns_records`,
    apiKey, email,
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
  const { apiKey, email } = getConfig()

  logger.info('[Cloudflare] Adding DNS record', { zoneId, type: record.type, name: record.name })

  const data = await cfFetch<DnsRecord>(
    `${CF_BASE}/zones/${zoneId}/dns_records`,
    apiKey, email,
    {
      method: 'POST',
      body: JSON.stringify(record),
    },
  )

  return data.result
}

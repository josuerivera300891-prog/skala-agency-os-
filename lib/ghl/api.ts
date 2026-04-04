// =============================================================================
// GoHighLevel API helper — locations import for GHL → Skala migration
// Base URL: https://services.leadconnectorhq.com
// Auth: Bearer token + Version header
// =============================================================================

import { z } from 'zod'
import { logger } from '@/lib/logger'

const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GHLLocation {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  timezone?: string
  business?: { name?: string; [key: string]: unknown }
  social?: { facebookUrl?: string; googlePlus?: string; [key: string]: unknown }
}

// Zod schema for runtime validation of GHL response
const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  business: z.record(z.string(), z.unknown()).optional().nullable(),
  social: z.record(z.string(), z.unknown()).optional().nullable(),
}).passthrough()

const locationsResponseSchema = z.object({
  locations: z.array(locationSchema),
})

const singleLocationResponseSchema = z.object({
  location: locationSchema,
}).passthrough()

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function ghlFetch(token: string, path: string): Promise<unknown> {
  const url = `${GHL_BASE}${path}`
  logger.debug('[GHL] Fetching', { url })

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    logger.error('[GHL] API error', { status: res.status, url, body })
    throw new Error(`GHL API ${res.status}: ${body || res.statusText}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List all locations (sub-accounts) accessible by the token.
 * GET /locations/search
 */
export async function listLocations(token: string): Promise<GHLLocation[]> {
  const raw = await ghlFetch(token, '/locations/search')
  const parsed = locationsResponseSchema.safeParse(raw)

  if (!parsed.success) {
    logger.error('[GHL] Invalid locations response', { errors: parsed.error.flatten() })
    throw new Error('Unexpected response format from GHL /locations/search')
  }

  logger.info('[GHL] Locations fetched', { count: parsed.data.locations.length })
  return parsed.data.locations as GHLLocation[]
}

/**
 * Get a single location by ID.
 * GET /locations/{locationId}
 */
export async function getLocation(token: string, locationId: string): Promise<GHLLocation> {
  const raw = await ghlFetch(token, `/locations/${encodeURIComponent(locationId)}`)
  const parsed = singleLocationResponseSchema.safeParse(raw)

  if (!parsed.success) {
    logger.error('[GHL] Invalid location response', { errors: parsed.error.flatten(), locationId })
    throw new Error('Unexpected response format from GHL /locations/{id}')
  }

  return parsed.data.location as GHLLocation
}

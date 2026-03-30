import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    return createMockClient()
  }

  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Components set() no está disponible
          }
        },
      },
    }
  )
}

// Cliente con service role para operaciones admin (crons, edge functions)
export function createServiceClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for createServiceClient')
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

// Mock client para desarrollo sin Supabase configurado
function createMockClient() {
  const emptyResponse = { data: null, error: null, count: null }
  const chainable = {
    select: () => chainable,
    insert: () => Promise.resolve(emptyResponse),
    update: () => chainable,
    delete: () => chainable,
    eq: () => chainable,
    neq: () => chainable,
    not: () => chainable,
    gte: () => chainable,
    lte: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    single: () => Promise.resolve(emptyResponse),
    maybeSingle: () => Promise.resolve(emptyResponse),
    then: (resolve: (v: typeof emptyResponse) => void) => Promise.resolve(emptyResponse).then(resolve),
  }
  return {
    from: () => chainable,
    auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
    channel: () => ({ subscribe: () => ({}) }),
  } as ReturnType<typeof createServerClient>
}

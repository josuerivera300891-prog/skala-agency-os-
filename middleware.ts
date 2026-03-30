import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ['/login', '/register', '/register/client']
const API_ROUTES = ['/api/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permitir rutas públicas y API routes sin auth
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/')) || API_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Crear cliente Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Dev mode sin Supabase: redirigir a login para evitar acceso sin auth
    logger.warn('[Middleware] Supabase no configurado — redirigiendo a login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const res = NextResponse.next()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return req.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // Si no hay usuario autenticado o hay error de auth → redirigir a login
  if (!user || userError) {
    if (userError) logger.error('[Middleware] Auth error', { error: userError.message })
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, agency_id, client_id')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error('[Middleware] Error al obtener perfil', { error: profileError.message })
    // Forzamos re-login para limpiar estado
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si es usuario tipo cliente → restringir a su portal
  if (profile?.role === 'client' && profile.client_id) {
    const portalPrefix = `/portal/${profile.client_id}`
    if (!pathname.startsWith('/portal/') && pathname !== '/') {
      return NextResponse.redirect(new URL(portalPrefix, req.url))
    }
    return res
  }

  // Si el usuario no tiene agency_id asignado y no está en onboarding
  if (profile && !profile.agency_id && profile.role !== 'client') {
    // Permitir acceso solo a settings para que complete su onboarding
    if (!pathname.startsWith('/settings') && pathname !== '/') {
      return NextResponse.redirect(new URL('/settings', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

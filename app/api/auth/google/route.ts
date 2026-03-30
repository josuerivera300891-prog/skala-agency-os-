import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUrl } from '@/lib/gmb/auth'

const querySchema = z.object({
  clientId: z.string().uuid('clientId debe ser un UUID válido'),
})

// GET /api/auth/google?clientId=<uuid>
// Redirige al consentimiento OAuth de Google
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const validation = querySchema.safeParse(params)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'clientId requerido y debe ser UUID' },
      { status: 400 }
    )
  }

  const url = getAuthUrl(validation.data.clientId)
  return NextResponse.redirect(url)
}

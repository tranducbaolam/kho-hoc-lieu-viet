import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isEmailVerified } from '@/lib/auth/emailVerification'
import { getSafeInternalPath } from '@/lib/auth/redirect'

export const runtime = 'nodejs'

const schema = z.object({
  path: z.string().min(1).max(2048),
})

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null
}

function safeDecodeHeader(value: string | null) {
  if (!value) return null
  try {
    return decodeURIComponent(value).slice(0, 255)
  } catch {
    return value.slice(0, 255)
  }
}

function hashIp(ip: string | null) {
  if (!ip || ip === 'unknown') return null
  const salt =
    process.env.VISIT_LOG_IP_HASH_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    'visit-log'

  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  const path = getSafeInternalPath(parsed.success ? parsed.data.path : null)
  if (!path || !path.startsWith('/hoc/')) {
    return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user && isEmailVerified(user) ? user.id : null

  const forwardedIp = firstHeaderValue(req.headers.get('x-forwarded-for'))
  const realIp = firstHeaderValue(req.headers.get('x-real-ip'))
  const userAgent = req.headers.get('user-agent')?.slice(0, 1000) ?? null

  const { error } = await createServiceClient()
    .from('visit_logs')
    .insert({
      path,
      ip_hash: hashIp(forwardedIp ?? realIp),
      user_agent: userAgent,
      country: safeDecodeHeader(req.headers.get('x-vercel-ip-country')),
      city: safeDecodeHeader(req.headers.get('x-vercel-ip-city')),
      user_id: userId,
    })

  if (error) {
    return NextResponse.json({ success: false, error: 'Unable to save visit' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isEmailVerified } from '@/lib/auth/emailVerification'
import { getInternalPathFromUrl, getSafeInternalPath } from '@/lib/auth/redirect'

export const runtime = 'nodejs'

function getReturnPath(req: NextRequest) {
  const explicitNext = getSafeInternalPath(req.nextUrl.searchParams.get('next'))
  if (explicitNext) return explicitNext

  const refererPath = getInternalPathFromUrl(req.headers.get('referer'))
  return getSafeInternalPath(refererPath) ?? '/'
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL('/login', req.nextUrl.origin)
  loginUrl.searchParams.set('next', getReturnPath(req))
  return NextResponse.redirect(loginUrl, { status: 302 })
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isEmailVerified(user)) {
    return redirectToLogin(req)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && profile?.role !== 'user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: attachment, error } = await supabase
    .from('post_attachments')
    .select('id, post_id, file_path, file_name')
    .eq('id', id)
    .single()

  if (error || !attachment?.file_path || !attachment.post_id) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const { data: post } = await supabase
    .from('posts')
    .select('status')
    .eq('id', attachment.post_id)
    .single()

  if (!isAdmin && post?.status !== 'published') {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  await createServiceClient().rpc('increment_attachment_download', { attachment_id: id })

  const { data: signed, error: signError } = await supabase
    .storage
    .from('post-attachments')
    .createSignedUrl(attachment.file_path, 60 * 5, {
      download: attachment.file_name,
    })

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Unable to create download url' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()

  const { data: attachment, error } = await supabase
    .from('post_attachments')
    .select('id, file_path, file_name')
    .eq('id', id)
    .single()

  if (error || !attachment?.file_path) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabase
    .storage
    .from('post-attachments')
    .createSignedUrl(attachment.file_path, 60 * 10, {
      download: attachment.file_name,
    })

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Unable to create download url' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}


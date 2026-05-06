import { createClient } from '@/lib/supabase/server'

export interface PostAttachment {
  id: string
  post_id: string
  file_name: string
  file_url: string
  file_path: string | null
  file_type: string | null
  file_size: number | null
  description: string | null
  display_order: number | null
  created_at: string | null
}

export async function getPostAttachments(postId: string): Promise<PostAttachment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('post_attachments')
    .select('*')
    .eq('post_id', postId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as PostAttachment[]
}


import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TagsManager } from './TagsManager'
import { requirePermission } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Thẻ' }

export default async function TagsPage() {
  await requirePermission('tags:write')

  const supabase = await createClient()
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  return (
    <div className="p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thẻ</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gắn từ khóa, dạng bài, mức độ hoặc năm thi.</p>
      </div>
      <TagsManager tags={tags ?? []} />
    </div>
  )
}

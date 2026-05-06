import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CategoriesManager } from './CategoriesManager'
import { requirePermission } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Chuyên mục phụ' }

export default async function CategoriesPage() {
  await requirePermission('categories:write')

  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chuyên mục phụ</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Phân nhóm phụ cho SEO và bộ lọc.</p>
      </div>
      <CategoriesManager categories={categories ?? []} />
    </div>
  )
}

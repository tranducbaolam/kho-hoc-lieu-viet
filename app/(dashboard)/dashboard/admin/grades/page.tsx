import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { getEducationGrades } from '@/features/education/queries'
import { GradesManager } from './GradesManager'

export const metadata: Metadata = { title: 'Lớp học' }

export default async function GradesPage() {
  await requirePermission('categories:write')
  const grades = await getEducationGrades()

  return (
    <div className="p-4 md:p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lớp học</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý cấp lớp chính cho nội dung giáo dục.</p>
      </div>
      <GradesManager grades={grades} />
    </div>
  )
}

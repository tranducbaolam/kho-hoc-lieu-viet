import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { getEducationSubjects } from '@/features/education/queries'
import { SubjectsManager } from './SubjectsManager'

export const metadata: Metadata = { title: 'Môn học' }

export default async function SubjectsPage() {
  await requirePermission('categories:write')
  const subjects = await getEducationSubjects()

  return (
    <div className="p-4 md:p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Môn học</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý môn học chính cho hệ thống bài học.</p>
      </div>
      <SubjectsManager subjects={subjects} />
    </div>
  )
}

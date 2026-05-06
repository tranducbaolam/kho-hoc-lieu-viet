import type { Metadata } from 'next'
import { requirePermission } from '@/lib/auth/session'
import { getEducationChapters, getEducationGrades, getEducationSubjects } from '@/features/education/queries'
import { ChaptersManager } from './ChaptersManager'

export const metadata: Metadata = { title: 'Chương / Chuyên đề' }

export default async function ChaptersPage() {
  await requirePermission('categories:write')
  const [chapters, grades, subjects] = await Promise.all([
    getEducationChapters(),
    getEducationGrades(),
    getEducationSubjects(),
  ])

  return (
    <div className="p-4 md:p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chương / Chuyên đề</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý cấu trúc chương theo lớp và môn học.</p>
      </div>
      <ChaptersManager chapters={chapters} grades={grades} subjects={subjects} />
    </div>
  )
}

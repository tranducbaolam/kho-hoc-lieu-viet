import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PostEditor } from '@/components/dashboard/PostEditor'
import { getEducationChapters, getEducationGrades, getEducationSubjects } from '@/features/education/queries'

export const metadata: Metadata = { title: 'Thêm bài' }

export default async function NewPostPage() {
  const supabase = await createClient()
  const [{ data: categories }, { data: tags }, educationGrades, educationSubjects, educationChapters] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('tags').select('*').order('name'),
    getEducationGrades(),
    getEducationSubjects(),
    getEducationChapters(),
  ])

  return (
    <div className="p-4 md:p-8 pb-16 animate-page">
      <PostEditor
        categories={categories ?? []}
        tags={tags ?? []}
        educationGrades={educationGrades}
        educationSubjects={educationSubjects}
        educationChapters={educationChapters}
      />
    </div>
  )
}

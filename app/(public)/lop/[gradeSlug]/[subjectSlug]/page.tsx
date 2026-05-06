import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getChaptersForGradeSubject,
  getGradeBySlug,
  getPublishedEducationPosts,
  getSubjectBySlug,
} from '@/features/education/queries'
import { EducationPostList } from '@/features/education/components/EducationPostList'

export const revalidate = 60

interface SubjectPageProps {
  params: Promise<{ gradeSlug: string; subjectSlug: string }>
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { gradeSlug, subjectSlug } = await params
  const [grade, subject] = await Promise.all([getGradeBySlug(gradeSlug), getSubjectBySlug(subjectSlug)])
  if (!grade || !subject) return {}
  return {
    title: `${subject.name} ${grade.name}`,
    description: `Bài học, lời giải, bài tập và đề thi ${subject.name} ${grade.name}.`,
  }
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { gradeSlug, subjectSlug } = await params
  const [grade, subject] = await Promise.all([getGradeBySlug(gradeSlug), getSubjectBySlug(subjectSlug)])
  if (!grade || !subject) notFound()

  const [chapters, latest] = await Promise.all([
    getChaptersForGradeSubject(grade.id, subject.id),
    getPublishedEducationPosts({ gradeId: grade.id, subjectId: subject.id, limit: 12 }),
  ])

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href={`/lop/${grade.slug}`} className="hover:text-foreground">{grade.name}</Link>
        <span className="mx-2">/</span>
        <span>{subject.name}</span>
      </nav>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{subject.name} {grade.name}</h1>
        <p className="mt-2 text-muted-foreground">Chọn chương để xem bài học, lời giải và bài tập.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border bg-white p-5 h-fit">
          <h2 className="font-bold mb-3">Chương / chuyên đề</h2>
          <div className="space-y-1">
            {chapters.map((chapter) => (
              <Link key={chapter.id} href={`/lop/${grade.slug}/${subject.slug}/${chapter.slug}`} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
                {chapter.name}
              </Link>
            ))}
            {chapters.length === 0 && <p className="text-sm text-muted-foreground">Chưa có chương.</p>}
          </div>
        </aside>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-xl font-bold">Bài mới nhất</h2>
          <EducationPostList posts={latest.posts} emptyText="Chưa có bài viết cho môn này." />
        </section>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEducationSubjects, getGradeBySlug, getPublishedEducationPosts } from '@/features/education/queries'
import { EducationPostList } from '@/features/education/components/EducationPostList'

export const revalidate = 60

interface GradePageProps {
  params: Promise<{ gradeSlug: string }>
}

export async function generateMetadata({ params }: GradePageProps): Promise<Metadata> {
  const { gradeSlug } = await params
  const grade = await getGradeBySlug(gradeSlug)
  if (!grade) return {}
  return {
    title: grade.name,
    description: grade.description ?? `Học liệu ${grade.name} theo môn học và chuyên đề.`,
  }
}

export default async function GradePage({ params }: GradePageProps) {
  const { gradeSlug } = await params
  const grade = await getGradeBySlug(gradeSlug)
  if (!grade) notFound()

  const [subjects, latest] = await Promise.all([
    getEducationSubjects(),
    getPublishedEducationPosts({ gradeId: grade.id, limit: 12 }),
  ])

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span>{grade.name}</span>
      </nav>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{grade.name}</h1>
        {grade.description && <p className="mt-2 text-muted-foreground">{grade.description}</p>}
      </div>
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Môn học</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject) => (
            <Link key={subject.id} href={`/lop/${grade.slug}/${subject.slug}`} className="rounded-lg border bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition">
              <p className="font-semibold">{subject.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{subject.description ?? 'Xem chương và bài học'}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-lg border bg-white p-5">
        <h2 className="text-xl font-bold">Bài mới trong {grade.name}</h2>
        <EducationPostList posts={latest.posts} emptyText="Chưa có bài viết cho lớp này." />
      </section>
    </div>
  )
}

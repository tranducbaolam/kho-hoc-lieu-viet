import Link from 'next/link'
import type { Metadata } from 'next'
import { getEducationGrades, getEducationSubjects, getPublishedEducationPosts } from '@/features/education/queries'
import { EducationPostList } from '@/features/education/components/EducationPostList'

export const metadata: Metadata = {
  title: 'Đề thi',
  description: 'Tổng hợp đề thi theo lớp, môn, năm thi, trường và địa phương.',
}

export const revalidate = 60

interface ExamsPageProps {
  searchParams: Promise<{ grade?: string; subject?: string; year?: string }>
}

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const params = await searchParams
  const [grades, subjects] = await Promise.all([getEducationGrades(), getEducationSubjects()])
  const grade = grades.find((item) => item.slug === params.grade)
  const subject = subjects.find((item) => item.slug === params.subject)
  const { posts } = await getPublishedEducationPosts({
    contentTypes: ['exam'],
    gradeId: grade?.id,
    subjectId: subject?.id,
    limit: 30,
  })

  const filtered = params.year
    ? posts.filter((post) => String(post.exam_year ?? '') === params.year)
    : posts

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span>Đề thi</span>
      </nav>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Đề thi</h1>
        <p className="mt-2 text-muted-foreground">Tìm đề thi theo lớp, môn học, năm thi, trường và tỉnh thành.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border bg-white p-4 h-fit space-y-4">
          <div>
            <h2 className="text-sm font-bold mb-2">Lọc theo lớp</h2>
            <div className="space-y-1">
              {grades.map((item) => (
                <Link key={item.id} href={`/de-thi?grade=${item.slug}${subject ? `&subject=${subject.slug}` : ''}`} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold mb-2">Lọc theo môn</h2>
            <div className="space-y-1">
              {subjects.map((item) => (
                <Link key={item.id} href={`/de-thi?${grade ? `grade=${grade.slug}&` : ''}subject=${item.slug}`} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-xl font-bold">
            {grade || subject ? `Kết quả ${grade?.name ?? ''} ${subject?.name ?? ''}` : 'Đề thi mới nhất'}
          </h2>
          <EducationPostList posts={filtered} emptyText="Chưa có đề thi phù hợp." />
        </section>
      </div>
    </div>
  )
}

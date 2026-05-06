import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import {
  getEducationChapters,
  getEducationGrades,
  getEducationSubjects,
  getPublishedEducationPosts,
} from '@/features/education/queries'
import { EducationPostList } from '@/features/education/components/EducationPostList'

export const metadata: Metadata = {
  title: 'Trang chủ',
  description: 'Bài học, lời giải, bài tập và đề thi được hệ thống theo lớp, môn và chuyên đề.',
}

export const revalidate = 60

interface HomePageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  }

  const [grades, subjects, chapters, latestLessons, latestExams] = await Promise.all([
    getEducationGrades(),
    getEducationSubjects(),
    getEducationChapters(),
    getPublishedEducationPosts({ contentTypes: ['lesson', 'solution', 'exercise'], limit: 8 }),
    getPublishedEducationPosts({ contentTypes: ['exam'], limit: 5 }),
  ])

  const featuredSubjects = subjects.filter((subject) => ['toan', 'ngu-van', 'tieng-anh', 'tin-hoc'].includes(subject.slug))
  const featuredChapters = chapters.slice(0, 8)

  return (
    <div>
      <section className="border-b bg-white">
        <div className="container max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Kho Học Liệu Việt</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Bài học, lời giải, bài tập và đề thi được hệ thống theo lớp, môn và chuyên đề.
            </p>
            <form action="/tim-kiem" className="mt-6 flex max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  placeholder="Tìm bài học, lời giải, đề thi..."
                  className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <button className="h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">
                Tìm kiếm
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="container max-w-7xl mx-auto px-4 py-10 space-y-12">
        <section>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Học theo lớp</h2>
              <p className="text-sm text-muted-foreground">Chọn lớp để xem môn học, chương và bài liên quan.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {grades.map((grade) => (
              <Link key={grade.id} href={`/lop/${grade.slug}`} className="rounded-lg border bg-white p-4 hover:border-emerald-300 hover:shadow-sm transition">
                <p className="text-lg font-bold">{grade.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Xem học liệu</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Môn học nổi bật</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featuredSubjects.map((subject) => (
              <Link key={subject.id} href={`/tim-kiem?subject=${subject.slug}`} className="rounded-lg border bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition">
                <p className="text-lg font-semibold">{subject.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{subject.description ?? 'Bài học và đề thi theo từng lớp.'}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border bg-white p-5">
            <h2 className="text-2xl font-bold tracking-tight">Bài học mới nhất</h2>
            <EducationPostList posts={latestLessons.posts} emptyText="Chưa có bài học được đăng." />
          </div>
          <aside className="space-y-6">
            <div className="rounded-lg border bg-white p-5">
              <h2 className="text-xl font-bold tracking-tight">Đề thi mới nhất</h2>
              <EducationPostList posts={latestExams.posts} emptyText="Chưa có đề thi." compact />
              <Link href="/de-thi" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                Xem tất cả đề thi
              </Link>
            </div>
            <div className="rounded-lg border bg-white p-5">
              <h2 className="text-xl font-bold tracking-tight mb-3">Chuyên đề nổi bật</h2>
              <div className="space-y-2">
                {featuredChapters.map((chapter) => chapter.grade && chapter.subject && (
                  <Link
                    key={chapter.id}
                    href={`/lop/${chapter.grade.slug}/${chapter.subject.slug}/${chapter.slug}`}
                    className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{chapter.name}</span>
                    <span className="block text-xs text-muted-foreground">{chapter.grade.name} / {chapter.subject.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

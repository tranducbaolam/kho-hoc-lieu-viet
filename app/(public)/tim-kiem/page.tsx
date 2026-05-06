import Link from 'next/link'
import type { Metadata } from 'next'
import { Search } from 'lucide-react'
import { getEducationGrades, getEducationSubjects, getPublishedEducationPosts } from '@/features/education/queries'
import { CONTENT_TYPE_LABELS, type ContentType } from '@/features/education/types'
import { EducationPostList } from '@/features/education/components/EducationPostList'

export const metadata: Metadata = {
  title: 'Tìm kiếm',
  description: 'Tìm kiếm bài học, lời giải, bài tập và đề thi.',
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; grade?: string; subject?: string; content_type?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const [grades, subjects] = await Promise.all([getEducationGrades(), getEducationSubjects()])
  const grade = grades.find((item) => item.slug === params.grade)
  const subject = subjects.find((item) => item.slug === params.subject)
  const contentType = params.content_type && params.content_type in CONTENT_TYPE_LABELS
    ? params.content_type as ContentType
    : undefined

  const { posts } = await getPublishedEducationPosts({
    search: params.q,
    gradeId: grade?.id,
    subjectId: subject?.id,
    contentTypes: contentType ? [contentType] : undefined,
    limit: 30,
  })

  const makeHref = (next: Record<string, string | undefined>) => {
    const url = new URLSearchParams()
    const values = { q: params.q, grade: params.grade, subject: params.subject, content_type: params.content_type, ...next }
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.set(key, value)
    })
    return `/tim-kiem?${url.toString()}`
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span>Tìm kiếm</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tìm kiếm</h1>
        <form action="/tim-kiem" className="mt-4 flex max-w-2xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="Nhập từ khóa..."
              className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <button className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Tìm</button>
        </form>
      </div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border bg-white p-4 h-fit space-y-5">
          <div>
            <h2 className="text-sm font-bold mb-2">Loại nội dung</h2>
            <div className="space-y-1">
              {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                <Link key={key} href={makeHref({ content_type: key })} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold mb-2">Lớp</h2>
            <div className="space-y-1">
              {grades.map((item) => (
                <Link key={item.id} href={makeHref({ grade: item.slug })} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">{item.name}</Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold mb-2">Môn</h2>
            <div className="space-y-1">
              {subjects.map((item) => (
                <Link key={item.id} href={makeHref({ subject: item.slug })} className="block rounded px-2 py-1.5 text-sm hover:bg-muted">{item.name}</Link>
              ))}
            </div>
          </div>
          <Link href="/tim-kiem" className="inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900">Xóa bộ lọc</Link>
        </aside>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="text-xl font-bold">
            {params.q ? `Kết quả cho "${params.q}"` : 'Tất cả nội dung phù hợp'}
          </h2>
          <EducationPostList posts={posts} emptyText="Không tìm thấy nội dung phù hợp." />
        </section>
      </div>
    </div>
  )
}

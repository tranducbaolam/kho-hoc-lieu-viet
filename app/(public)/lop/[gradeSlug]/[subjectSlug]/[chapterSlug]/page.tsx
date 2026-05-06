import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getChapterByPath, getPublishedEducationPosts } from '@/features/education/queries'
import { EducationPostList } from '@/features/education/components/EducationPostList'

export const revalidate = 60

interface ChapterPageProps {
  params: Promise<{ gradeSlug: string; subjectSlug: string; chapterSlug: string }>
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { gradeSlug, subjectSlug, chapterSlug } = await params
  const chapter = await getChapterByPath(gradeSlug, subjectSlug, chapterSlug)
  if (!chapter) return {}
  return {
    title: `${chapter.name} - ${chapter.subject?.name} ${chapter.grade?.name}`,
    description: chapter.description ?? `Bài học và lời giải chuyên đề ${chapter.name}.`,
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { gradeSlug, subjectSlug, chapterSlug } = await params
  const chapter = await getChapterByPath(gradeSlug, subjectSlug, chapterSlug)
  if (!chapter || !chapter.grade || !chapter.subject) notFound()

  const { posts } = await getPublishedEducationPosts({ chapterId: chapter.id, limit: 50 })

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href={`/lop/${chapter.grade.slug}`} className="hover:text-foreground">{chapter.grade.name}</Link>
        <span className="mx-2">/</span>
        <Link href={`/lop/${chapter.grade.slug}/${chapter.subject.slug}`} className="hover:text-foreground">{chapter.subject.name}</Link>
        <span className="mx-2">/</span>
        <span>{chapter.name}</span>
      </nav>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{chapter.name}</h1>
        {chapter.description && <p className="mt-2 text-muted-foreground">{chapter.description}</p>}
      </div>
      <section className="rounded-lg border bg-white p-5">
        <h2 className="text-xl font-bold">Danh sách bài học</h2>
        <EducationPostList posts={posts} emptyText="Chưa có bài viết trong chương này." />
      </section>
    </div>
  )
}

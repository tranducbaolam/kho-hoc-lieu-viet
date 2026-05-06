import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPostBySlug } from '@/features/posts/queries'
import { getChaptersForGradeSubject, getRelatedPosts } from '@/features/education/queries'
import { getPostAttachments } from '@/features/attachments/queries'
import { EditorContent } from '@/components/editor/EditorContent'
import { CommentSection } from '@/features/comments/components/CommentSection'
import { SubscribeForm } from '@/components/newsletter/SubscribeForm'
import { ShareButton } from '@/components/ShareButton'
import { CONTENT_TYPE_LABELS, DIFFICULTY_LABELS } from '@/features/education/types'
import { EducationPostList } from '@/features/education/components/EducationPostList'
import { PublicAttachmentsSection } from '@/features/attachments/components/PublicAttachmentsSection'
import { createClient } from '@/lib/supabase/server'
import { isEmailVerified } from '@/lib/auth/emailVerification'

export const revalidate = 3600

interface EducationPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EducationPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || '',
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || '',
      type: 'article',
      images: post.cover_image ? [post.cover_image] : [],
    },
  }
}

export default async function EducationPostPage({ params }: EducationPostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const supabase = await createClient()
  const [authResult, relatedPosts, siblingChapters, attachments] = await Promise.all([
    supabase.auth.getUser(),
    getRelatedPosts(post, 6),
    post.grade_id && post.subject_id ? getChaptersForGradeSubject(post.grade_id, post.subject_id) : Promise.resolve([]),
    getPostAttachments(post.id),
  ])

  const isAuthenticated = isEmailVerified(authResult.data.user)
  const currentPath = `/hoc/${post.slug}`
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
  const contentTypeLabel = post.content_type && post.content_type in CONTENT_TYPE_LABELS
    ? CONTENT_TYPE_LABELS[post.content_type as keyof typeof CONTENT_TYPE_LABELS]
    : 'Bài học'
  const difficultyLabel = post.difficulty && post.difficulty in DIFFICULTY_LABELS
    ? DIFFICULTY_LABELS[post.difficulty as keyof typeof DIFFICULTY_LABELS]
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': post.content_type === 'exam' ? 'Quiz' : 'LearningResource',
    name: post.title,
    description: post.excerpt ?? post.seo_description ?? '',
    educationalLevel: post.grade?.name,
    learningResourceType: contentTypeLabel,
    datePublished: post.published_at,
    dateModified: post.updated_at,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <nav className="mb-5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Trang chủ</Link>
          {post.grade && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/lop/${post.grade.slug}`} className="hover:text-foreground">{post.grade.name}</Link>
            </>
          )}
          {post.grade && post.subject && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/lop/${post.grade.slug}/${post.subject.slug}`} className="hover:text-foreground">{post.subject.name}</Link>
            </>
          )}
          {post.grade && post.subject && post.chapter && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/lop/${post.grade.slug}/${post.subject.slug}/${post.chapter.slug}`} className="hover:text-foreground">{post.chapter.name}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span>{post.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            <div className="mb-6">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-700">{contentTypeLabel}</span>
                {post.grade && <span className="rounded bg-muted px-2 py-1">{post.grade.name}</span>}
                {post.subject && <span className="rounded bg-muted px-2 py-1">{post.subject.name}</span>}
                {difficultyLabel && <span className="rounded bg-muted px-2 py-1">{difficultyLabel}</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{post.title}</h1>
              {post.excerpt && <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>}
              <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{post.author?.full_name ?? post.author?.email ?? 'Giáo viên'}</span>
                <div className="ml-auto">
                  <ShareButton url={`${baseUrl}/hoc/${post.slug}`} title={post.title} />
                </div>
              </div>
            </div>

            {post.content_type === 'exam' && (
              <PublicAttachmentsSection
                prominent
                isAuthenticated={isAuthenticated}
                currentPath={currentPath}
                attachments={attachments.map((a) => ({
                  id: a.id,
                  file_name: a.file_name,
                  file_url: a.file_url,
                  description: a.description,
                  file_size: a.file_size,
                  file_type: a.file_type,
                }))}
              />
            )}

            <EditorContent content={post.content ?? ''} />

            {post.content_type !== 'exam' && (
              <PublicAttachmentsSection
                isAuthenticated={isAuthenticated}
                currentPath={currentPath}
                attachments={attachments.map((a) => ({
                  id: a.id,
                  file_name: a.file_name,
                  file_url: a.file_url,
                  description: a.description,
                  file_size: a.file_size,
                  file_type: a.file_type,
                }))}
              />
            )}

            {post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag.id} href={`/blog/tag/${tag.slug}`} className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-accent">
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            <SubscribeForm />
            <CommentSection postId={post.id} postSlug={post.slug} />
          </article>

          <aside className="space-y-5">
            {siblingChapters.length > 0 && post.grade && post.subject && (
              <div className="rounded-lg border bg-white p-4">
                <h2 className="font-bold mb-3">Chương cùng môn</h2>
                <div className="space-y-1">
                  {siblingChapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/lop/${post.grade!.slug}/${post.subject!.slug}/${chapter.slug}`}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                    >
                      {chapter.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-white p-4">
              <h2 className="font-bold mb-2">Bài liên quan</h2>
              <EducationPostList posts={relatedPosts} emptyText="Chưa có bài liên quan." compact />
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

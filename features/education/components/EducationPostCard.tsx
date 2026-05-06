import Link from 'next/link'
import { format } from 'date-fns'
import type { PostWithRelations } from '@/features/posts/types'
import { CONTENT_TYPE_LABELS } from '@/features/education/types'

interface EducationPostCardProps {
  post: PostWithRelations
  compact?: boolean
}

export function EducationPostCard({ post, compact = false }: EducationPostCardProps) {
  const contentType = post.content_type && post.content_type in CONTENT_TYPE_LABELS
    ? CONTENT_TYPE_LABELS[post.content_type as keyof typeof CONTENT_TYPE_LABELS]
    : 'Bài học'

  return (
    <article className="border-b border-border py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{contentType}</span>
            {post.grade && <span className="text-xs text-muted-foreground">{post.grade.name}</span>}
            {post.subject && <span className="text-xs text-muted-foreground">{post.subject.name}</span>}
          </div>
          <Link href={`/hoc/${post.slug}`} className="group">
            <h3 className={compact ? 'font-semibold leading-snug group-hover:text-emerald-700' : 'text-lg font-semibold leading-snug group-hover:text-emerald-700'}>
              {post.title}
            </h3>
          </Link>
          {!compact && post.excerpt && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
          )}
          {post.chapter && (
            <p className="mt-1 text-xs text-muted-foreground">Chương: {post.chapter.name}</p>
          )}
        </div>
        {post.published_at && (
          <time dateTime={post.published_at} className="hidden sm:block shrink-0 text-xs text-muted-foreground">
            {format(new Date(post.published_at), 'dd/MM/yyyy')}
          </time>
        )}
      </div>
    </article>
  )
}

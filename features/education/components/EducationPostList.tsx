import type { PostWithRelations } from '@/features/posts/types'
import { EducationPostCard } from './EducationPostCard'

interface EducationPostListProps {
  posts: PostWithRelations[]
  emptyText?: string
  compact?: boolean
}

export function EducationPostList({ posts, emptyText = 'Chưa có bài viết.', compact }: EducationPostListProps) {
  if (posts.length === 0) {
    return <p className="py-8 text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="divide-y-0">
      {posts.map((post) => (
        <EducationPostCard key={post.id} post={post} compact={compact} />
      ))}
    </div>
  )
}

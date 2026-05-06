import type { PostWithRelations } from '@/features/posts/types'

export type SortField = 'title' | 'author' | 'status' | 'updated_at' | 'content_type' | 'grade' | 'subject' | 'chapter'
export type SortDir = 'asc' | 'desc'

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

export function getCategories(posts: PostWithRelations[]) {
  const map = new Map<string, string>()
  for (const post of posts) {
    if (post.category) map.set(post.category.id, post.category.name)
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
}

export function getEducationFilterOptions(posts: PostWithRelations[]) {
  const grades = new Map<string, string>()
  const subjects = new Map<string, string>()
  const chapters = new Map<string, string>()
  for (const post of posts) {
    if (post.grade) grades.set(post.grade.id, post.grade.name)
    if (post.subject) subjects.set(post.subject.id, post.subject.name)
    if (post.chapter) chapters.set(post.chapter.id, post.chapter.name)
  }
  return {
    grades: Array.from(grades.entries()).map(([id, name]) => ({ id, name })),
    subjects: Array.from(subjects.entries()).map(([id, name]) => ({ id, name })),
    chapters: Array.from(chapters.entries()).map(([id, name]) => ({ id, name })),
  }
}

export function filterAndSort(
  posts: PostWithRelations[],
  search: string,
  categoryFilter: string | null,
  statusFilter: string | null = null,
  contentTypeFilter: string | null = null,
  gradeFilter: string | null = null,
  subjectFilter: string | null = null,
  chapterFilter: string | null = null,
  sortField: SortField = 'updated_at',
  sortDir: SortDir = 'desc',
): PostWithRelations[] {
  if (arguments.length <= 5) {
    sortField = (statusFilter as SortField | null) ?? 'updated_at'
    sortDir = (contentTypeFilter as SortDir | null) ?? 'desc'
    statusFilter = null
    contentTypeFilter = null
  }

  let result = posts

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(p => p.title.toLowerCase().includes(q))
  }

  if (categoryFilter) {
    result = result.filter(p => p.category?.id === categoryFilter)
  }

  if (statusFilter) result = result.filter(p => p.status === statusFilter)
  if (contentTypeFilter) result = result.filter(p => p.content_type === contentTypeFilter)
  if (gradeFilter) result = result.filter(p => p.grade?.id === gradeFilter)
  if (subjectFilter) result = result.filter(p => p.subject?.id === subjectFilter)
  if (chapterFilter) result = result.filter(p => p.chapter?.id === chapterFilter)

  return [...result].sort((a, b) => {
    let aVal = ''
    let bVal = ''
    if (sortField === 'title') {
      aVal = a.title.toLowerCase()
      bVal = b.title.toLowerCase()
    } else if (sortField === 'author') {
      aVal = (a.author?.full_name ?? a.author?.email ?? '').toLowerCase()
      bVal = (b.author?.full_name ?? b.author?.email ?? '').toLowerCase()
    } else if (sortField === 'status') {
      aVal = a.status
      bVal = b.status
    } else if (sortField === 'updated_at') {
      aVal = a.updated_at ?? ''
      bVal = b.updated_at ?? ''
    } else if (sortField === 'content_type') {
      aVal = a.content_type ?? ''
      bVal = b.content_type ?? ''
    } else if (sortField === 'grade') {
      aVal = a.grade?.name ?? ''
      bVal = b.grade?.name ?? ''
    } else if (sortField === 'subject') {
      aVal = a.subject?.name ?? ''
      bVal = b.subject?.name ?? ''
    } else if (sortField === 'chapter') {
      aVal = a.chapter?.name ?? ''
      bVal = b.chapter?.name ?? ''
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })
}

export function buildPageNumbers(totalPages: number, currentPage: number): (number | '...')[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && typeof arr[idx - 1] === 'number' && p - (arr[idx - 1] as number) > 1) {
        acc.push('...')
      }
      acc.push(p)
      return acc
    }, [])
}

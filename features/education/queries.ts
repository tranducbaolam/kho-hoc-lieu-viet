import { createClient } from '@/lib/supabase/server'
import type { EducationChapter, EducationGrade, EducationSubject } from '@/lib/supabase/types'
import type { ChapterWithRelations, ContentType } from './types'
import type { PostWithRelations } from '@/features/posts/types'

const EDUCATION_POST_SELECT = `
  *,
  author:profiles!posts_author_id_fkey(id, full_name, email, avatar_url),
  category:categories(id, name, slug),
  tags:post_tags(tag:tags(id, name, slug)),
  grade:education_grades(id, name, slug, level_order),
  subject:education_subjects(id, name, slug),
  chapter:education_chapters(id, name, slug, chapter_order)
`

function normalizePost(raw: Record<string, unknown>): PostWithRelations {
  const tags = ((raw.tags as { tag?: unknown }[] | null) ?? [])
    .map((pt) => pt.tag)
    .filter(Boolean)

  return {
    ...raw,
    tags,
  } as PostWithRelations
}

function escapeIlike(value: string): string {
  return value.replace(/[%,]/g, ' ').trim()
}

export async function getEducationGrades(): Promise<EducationGrade[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_grades')
    .select('*')
    .order('level_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as EducationGrade[]
}

export async function getEducationSubjects(): Promise<EducationSubject[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_subjects')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as EducationSubject[]
}

export async function getEducationChapters(): Promise<ChapterWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_chapters')
    .select(`
      *,
      grade:education_grades(id, name, slug, level_order),
      subject:education_subjects(id, name, slug)
    `)
    .order('chapter_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as ChapterWithRelations[]
}

export async function getGradeBySlug(slug: string): Promise<EducationGrade | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_grades')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as EducationGrade
}

export async function getSubjectBySlug(slug: string): Promise<EducationSubject | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_subjects')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as EducationSubject
}

export async function getChapterByPath(
  gradeSlug: string,
  subjectSlug: string,
  chapterSlug: string
): Promise<ChapterWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_chapters')
    .select(`
      *,
      grade:education_grades!inner(id, name, slug, level_order),
      subject:education_subjects!inner(id, name, slug)
    `)
    .eq('slug', chapterSlug)
    .eq('grade.slug', gradeSlug)
    .eq('subject.slug', subjectSlug)
    .single()
  if (error) return null
  return data as unknown as ChapterWithRelations
}

export async function getChaptersForGradeSubject(
  gradeId: string,
  subjectId?: string
): Promise<ChapterWithRelations[]> {
  const supabase = await createClient()
  let query = supabase
    .from('education_chapters')
    .select(`
      *,
      grade:education_grades(id, name, slug, level_order),
      subject:education_subjects(id, name, slug)
    `)
    .eq('grade_id', gradeId)
    .order('chapter_order', { ascending: true })
    .order('name', { ascending: true })

  if (subjectId) query = query.eq('subject_id', subjectId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as ChapterWithRelations[]
}

export async function getPublishedEducationPosts(options: {
  gradeId?: string
  subjectId?: string
  chapterId?: string
  contentTypes?: ContentType[]
  search?: string
  limit?: number
  page?: number
} = {}): Promise<{ posts: PostWithRelations[]; total: number }> {
  const supabase = await createClient()
  const page = Math.max(options.page ?? 1, 1)
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50)
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('posts')
    .select(EDUCATION_POST_SELECT, { count: 'exact' })
    .eq('status', 'published')

  if (options.gradeId) query = query.eq('grade_id', options.gradeId)
  if (options.subjectId) query = query.eq('subject_id', options.subjectId)
  if (options.chapterId) query = query.eq('chapter_id', options.chapterId)
  if (options.contentTypes?.length) query = query.in('content_type', options.contentTypes)
  if (options.search?.trim()) {
    const q = escapeIlike(options.search)
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,school_name.ilike.%${q}%,province.ilike.%${q}%`)
  }

  const { data, error, count } = await query
    .order('lesson_order', { ascending: true })
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return {
    posts: ((data ?? []) as Record<string, unknown>[]).map(normalizePost),
    total: count ?? 0,
  }
}

export async function getRelatedPosts(post: PostWithRelations, limit = 6): Promise<PostWithRelations[]> {
  if (!post.grade_id && !post.subject_id && !post.chapter_id) return []
  const { posts } = await getPublishedEducationPosts({
    gradeId: post.grade_id ?? undefined,
    subjectId: post.subject_id ?? undefined,
    chapterId: post.chapter_id ?? undefined,
    limit: limit + 1,
  })
  return posts.filter((item) => item.id !== post.id).slice(0, limit)
}

import type { EducationChapter, EducationGrade, EducationSubject } from '@/lib/supabase/types'
import type { PostWithRelations } from '@/features/posts/types'

export type ContentType = 'lesson' | 'solution' | 'exercise' | 'exam' | 'news'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'advanced'

export type ChapterWithRelations = EducationChapter & {
  grade: Pick<EducationGrade, 'id' | 'name' | 'slug' | 'level_order'> | null
  subject: Pick<EducationSubject, 'id' | 'name' | 'slug'> | null
}

export type EducationFilters = {
  gradeId?: string
  subjectId?: string
  chapterId?: string
  contentType?: ContentType
  limit?: number
}

export type EducationPath = {
  grade: EducationGrade
  subject?: EducationSubject
  chapter?: ChapterWithRelations
  posts: PostWithRelations[]
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  lesson: 'Bài học',
  solution: 'Lời giải',
  exercise: 'Bài tập',
  exam: 'Đề thi',
  news: 'Tin tức',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
  advanced: 'Nâng cao',
}

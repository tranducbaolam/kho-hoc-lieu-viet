import type {
  Post,
  Profile,
  Category,
  Tag,
  EducationGrade,
  EducationSubject,
  EducationChapter,
} from '@/lib/supabase/types'
import type { ContentType, Difficulty } from '@/features/education/types'

export type PostWithRelations = Post & {
  author: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  grade: Pick<EducationGrade, 'id' | 'name' | 'slug' | 'level_order'> | null
  subject: Pick<EducationSubject, 'id' | 'name' | 'slug'> | null
  chapter: Pick<EducationChapter, 'id' | 'name' | 'slug' | 'chapter_order'> | null
  tags: Tag[]
}

export type PostFormValues = {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  category_id: string
  content_type: ContentType
  grade_id: string
  subject_id: string
  chapter_id: string
  lesson_order: number
  difficulty: Difficulty | ''
  exam_type: string
  exam_year: number | null
  school_name: string
  province: string
  seo_title: string
  seo_description: string
  tag_ids: string[]
}

export type { Post, Category, Tag, EducationGrade, EducationSubject, EducationChapter }

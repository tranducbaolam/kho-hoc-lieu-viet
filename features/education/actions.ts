'use server'

import { revalidatePath } from 'next/cache'
import slugify from 'slugify'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/session'

type ActionResult<T = unknown> = { data?: T; error?: string }

function cleanSlug(value: string): string {
  return slugify(value, { lower: true, strict: true, locale: 'vi' })
}

function requiredText(formData: FormData, key: string, label: string): string | { error: string } {
  const value = String(formData.get(key) ?? '').trim()
  if (!value) return { error: `${label} là bắt buộc` }
  return value
}

function optionalText(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim()
  return value || null
}

function numberValue(formData: FormData, key: string, fallback: number): number {
  const raw = String(formData.get(key) ?? '').trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function requireEducationAdmin(): Promise<{ id: string } | { error: string }> {
  const profile = await getProfile()
  if (!profile) return { error: 'Unauthorized' }
  if (profile.role !== 'admin') return { error: 'Chỉ quản trị viên được chỉnh sửa taxonomy giáo dục' }
  return { id: profile.id }
}

export async function createGrade(formData: FormData): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const name = requiredText(formData, 'name', 'Tên lớp')
  if (typeof name !== 'string') return name
  const slug = optionalText(formData, 'slug') ?? cleanSlug(name)
  const levelOrder = numberValue(formData, 'level_order', 0)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_grades')
    .insert({
      name,
      slug,
      level_order: levelOrder,
      description: optionalText(formData, 'description'),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/grades')
  revalidatePath('/')
  return { data }
}

export async function updateGrade(id: string, formData: FormData): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const name = requiredText(formData, 'name', 'Tên lớp')
  if (typeof name !== 'string') return name
  const slug = optionalText(formData, 'slug') ?? cleanSlug(name)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_grades')
    .update({
      name,
      slug,
      level_order: numberValue(formData, 'level_order', 0),
      description: optionalText(formData, 'description'),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/grades')
  revalidatePath('/')
  return { data }
}

export async function deleteGrade(id: string): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const supabase = await createClient()
  const { error } = await supabase.from('education_grades').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/grades')
  revalidatePath('/')
  return { data: true }
}

export async function createSubject(formData: FormData): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const name = requiredText(formData, 'name', 'Tên môn học')
  if (typeof name !== 'string') return name
  const slug = optionalText(formData, 'slug') ?? cleanSlug(name)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_subjects')
    .insert({ name, slug, description: optionalText(formData, 'description') })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/subjects')
  revalidatePath('/')
  return { data }
}

export async function updateSubject(id: string, formData: FormData): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const name = requiredText(formData, 'name', 'Tên môn học')
  if (typeof name !== 'string') return name
  const slug = optionalText(formData, 'slug') ?? cleanSlug(name)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_subjects')
    .update({ name, slug, description: optionalText(formData, 'description') })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/subjects')
  revalidatePath('/')
  return { data }
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const supabase = await createClient()
  const { error } = await supabase.from('education_subjects').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/subjects')
  revalidatePath('/')
  return { data: true }
}

export async function createChapter(formData: FormData): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const name = requiredText(formData, 'name', 'Tên chương')
  if (typeof name !== 'string') return name
  const gradeId = requiredText(formData, 'grade_id', 'Lớp học')
  if (typeof gradeId !== 'string') return gradeId
  const subjectId = requiredText(formData, 'subject_id', 'Môn học')
  if (typeof subjectId !== 'string') return subjectId

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_chapters')
    .insert({
      grade_id: gradeId,
      subject_id: subjectId,
      name,
      slug: optionalText(formData, 'slug') ?? cleanSlug(name),
      description: optionalText(formData, 'description'),
      chapter_order: numberValue(formData, 'chapter_order', 0),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/chapters')
  revalidatePath('/')
  return { data }
}

export async function updateChapter(id: string, formData: FormData): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const name = requiredText(formData, 'name', 'Tên chương')
  if (typeof name !== 'string') return name
  const gradeId = requiredText(formData, 'grade_id', 'Lớp học')
  if (typeof gradeId !== 'string') return gradeId
  const subjectId = requiredText(formData, 'subject_id', 'Môn học')
  if (typeof subjectId !== 'string') return subjectId

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('education_chapters')
    .update({
      grade_id: gradeId,
      subject_id: subjectId,
      name,
      slug: optionalText(formData, 'slug') ?? cleanSlug(name),
      description: optionalText(formData, 'description'),
      chapter_order: numberValue(formData, 'chapter_order', 0),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/chapters')
  revalidatePath('/')
  return { data }
}

export async function deleteChapter(id: string): Promise<ActionResult> {
  const admin = await requireEducationAdmin()
  if ('error' in admin) return { error: admin.error }

  const supabase = await createClient()
  const { error } = await supabase.from('education_chapters').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin/chapters')
  revalidatePath('/')
  return { data: true }
}

'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Layers3, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EducationGrade, EducationSubject } from '@/lib/supabase/types'
import type { ChapterWithRelations } from '@/features/education/types'
import { createChapter, deleteChapter, updateChapter } from '@/features/education/actions'

interface ChaptersManagerProps {
  chapters: ChapterWithRelations[]
  grades: EducationGrade[]
  subjects: EducationSubject[]
}

export function ChaptersManager({ chapters, grades, subjects }: ChaptersManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const grouped = useMemo(() => chapters, [chapters])

  async function handleCreate(formData: FormData) {
    const result = await createChapter(formData)
    result.error ? toast.error(result.error) : toast.success('Đã tạo chương')
  }

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateChapter(id, formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      setEditingId(null)
      toast.success('Đã cập nhật chương')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa chương "${name}"? Các bài viết đang gắn chương này sẽ mất liên kết chương.`)) return
    const result = await deleteChapter(id)
    result.error ? toast.error(result.error) : toast.success('Đã xóa chương')
  }

  const gradeOptions = grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)
  const subjectOptions = subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
      <form action={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
            <Plus className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Thêm chương / chuyên đề</h2>
            <p className="text-xs text-muted-foreground">Gắn với một lớp và một môn học.</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Lớp</Label>
            <select name="grade_id" required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Chọn lớp</option>
              {gradeOptions}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Môn</Label>
            <select name="subject_id" required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Chọn môn</option>
              {subjectOptions}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tên chương</Label>
          <Input name="name" required placeholder="Căn bậc hai" />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_96px]">
          <div className="space-y-1">
            <Label className="text-xs">Slug</Label>
            <Input name="slug" placeholder="can-bac-hai" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Thứ tự</Label>
            <Input name="chapter_order" type="number" defaultValue={0} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mô tả</Label>
          <Textarea name="description" rows={3} />
        </div>
        <Button type="submit" className="w-full">
          <Plus className="mr-1.5 h-4 w-4" />Tạo chương
        </Button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <Layers3 className="h-5 w-5 text-violet-600" />
          <div>
            <h2 className="text-sm font-semibold">Danh sách chương / chuyên đề</h2>
            <p className="text-xs text-muted-foreground">{chapters.length} chương</p>
          </div>
        </div>
        <div className="space-y-2">
          {grouped.map((chapter) => (
            <div key={chapter.id} className="rounded-lg border border-gray-100 p-3">
              {editingId === chapter.id ? (
                <form action={(formData) => handleUpdate(chapter.id, formData)} className="grid gap-2 md:grid-cols-[120px_140px_1fr_1fr_90px_auto]">
                  <select name="grade_id" required defaultValue={chapter.grade_id ?? ''} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    {gradeOptions}
                  </select>
                  <select name="subject_id" required defaultValue={chapter.subject_id ?? ''} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    {subjectOptions}
                  </select>
                  <Input name="name" defaultValue={chapter.name} required />
                  <Input name="slug" defaultValue={chapter.slug} required />
                  <Input name="chapter_order" type="number" defaultValue={chapter.chapter_order ?? 0} />
                  <div className="flex gap-1">
                    <Button type="submit" size="icon" aria-label="Lưu"><Save className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => setEditingId(null)} aria-label="Hủy"><X className="h-4 w-4" /></Button>
                  </div>
                  <Input name="description" defaultValue={chapter.description ?? ''} className="md:col-span-5" />
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{chapter.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {chapter.grade?.name ?? 'Chưa có lớp'} / {chapter.subject?.name ?? 'Chưa có môn'} / {chapter.slug} · thứ tự {chapter.chapter_order ?? 0}
                    </p>
                    {chapter.description && <p className="text-xs text-muted-foreground mt-1">{chapter.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingId(chapter.id)} aria-label="Sửa">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(chapter.id, chapter.name)} aria-label="Xóa">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

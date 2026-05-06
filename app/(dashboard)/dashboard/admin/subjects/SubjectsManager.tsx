'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EducationSubject } from '@/lib/supabase/types'
import { createSubject, deleteSubject, updateSubject } from '@/features/education/actions'

interface SubjectsManagerProps {
  subjects: EducationSubject[]
}

export function SubjectsManager({ subjects }: SubjectsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleCreate(formData: FormData) {
    const result = await createSubject(formData)
    result.error ? toast.error(result.error) : toast.success('Đã tạo môn học')
  }

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateSubject(id, formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      setEditingId(null)
      toast.success('Đã cập nhật môn học')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa môn "${name}"? Các chương liên quan sẽ bị xóa.`)) return
    const result = await deleteSubject(id)
    result.error ? toast.error(result.error) : toast.success('Đã xóa môn học')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
      <form action={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <Plus className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Thêm môn học</h2>
            <p className="text-xs text-muted-foreground">Ví dụ: Toán / toan</p>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tên môn</Label>
          <Input name="name" required placeholder="Toán" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input name="slug" placeholder="toan" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mô tả</Label>
          <Textarea name="description" rows={3} />
        </div>
        <Button type="submit" className="w-full">
          <Plus className="mr-1.5 h-4 w-4" />Tạo môn học
        </Button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-semibold">Danh sách môn học</h2>
            <p className="text-xs text-muted-foreground">{subjects.length} môn</p>
          </div>
        </div>
        <div className="space-y-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-lg border border-gray-100 p-3">
              {editingId === subject.id ? (
                <form action={(formData) => handleUpdate(subject.id, formData)} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <Input name="name" defaultValue={subject.name} required />
                  <Input name="slug" defaultValue={subject.slug} required />
                  <div className="flex gap-1">
                    <Button type="submit" size="icon" aria-label="Lưu"><Save className="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => setEditingId(null)} aria-label="Hủy"><X className="h-4 w-4" /></Button>
                  </div>
                  <Input name="description" defaultValue={subject.description ?? ''} className="md:col-span-2" />
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">/{subject.slug}</p>
                    {subject.description && <p className="text-xs text-muted-foreground mt-1">{subject.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingId(subject.id)} aria-label="Sửa">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(subject.id, subject.name)} aria-label="Xóa">
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

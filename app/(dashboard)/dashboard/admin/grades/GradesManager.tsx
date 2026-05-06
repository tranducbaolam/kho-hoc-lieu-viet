'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { GraduationCap, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EducationGrade } from '@/lib/supabase/types'
import { createGrade, deleteGrade, updateGrade } from '@/features/education/actions'

interface GradesManagerProps {
  grades: EducationGrade[]
}

export function GradesManager({ grades }: GradesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleCreate(formData: FormData) {
    const result = await createGrade(formData)
    result.error ? toast.error(result.error) : toast.success('Đã tạo lớp học')
  }

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateGrade(id, formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      setEditingId(null)
      toast.success('Đã cập nhật lớp học')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa lớp "${name}"? Các chương liên quan sẽ bị xóa.`)) return
    const result = await deleteGrade(id)
    result.error ? toast.error(result.error) : toast.success('Đã xóa lớp học')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
      <form action={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Plus className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Thêm lớp học</h2>
            <p className="text-xs text-muted-foreground">Ví dụ: Lớp 9 / lop-9</p>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tên lớp</Label>
          <Input name="name" required placeholder="Lớp 9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input name="slug" placeholder="lop-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Thứ tự</Label>
          <Input name="level_order" type="number" required defaultValue={9} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mô tả</Label>
          <Textarea name="description" rows={3} />
        </div>
        <Button type="submit" className="w-full">
          <Plus className="mr-1.5 h-4 w-4" />Tạo lớp
        </Button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-semibold">Danh sách lớp học</h2>
            <p className="text-xs text-muted-foreground">{grades.length} lớp</p>
          </div>
        </div>
        <div className="space-y-2">
          {grades.map((grade) => (
            <div key={grade.id} className="rounded-lg border border-gray-100 p-3">
              {editingId === grade.id ? (
                <form action={(formData) => handleUpdate(grade.id, formData)} className="grid gap-2 md:grid-cols-[1fr_1fr_90px_auto]">
                  <Input name="name" defaultValue={grade.name} required />
                  <Input name="slug" defaultValue={grade.slug} required />
                  <Input name="level_order" type="number" defaultValue={grade.level_order} required />
                  <Input name="description" defaultValue={grade.description ?? ''} className="md:col-span-3" />
                  <div className="flex gap-1">
                    <Button type="submit" size="icon" aria-label="Lưu">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => setEditingId(null)} aria-label="Hủy">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{grade.name}</p>
                    <p className="text-xs text-muted-foreground">/{grade.slug} · thứ tự {grade.level_order}</p>
                    {grade.description && <p className="text-xs text-muted-foreground mt-1">{grade.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => setEditingId(grade.id)} aria-label="Sửa">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleDelete(grade.id, grade.name)} aria-label="Xóa">
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

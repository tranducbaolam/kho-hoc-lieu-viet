'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatBytes, isAllowedAttachmentFileName, safeFileName } from '@/lib/attachments/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type AttachmentRow = {
  id: string
  post_id: string
  file_name: string
  file_url: string
  file_path: string | null
  file_type: string | null
  file_size: number | null
  description: string | null
  display_order: number | null
  created_at: string | null
}

export function PostAttachmentsManager({ postId }: { postId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])

  async function refresh() {
    setLoading(true)
    const { data, error } = await supabase
      .from('post_attachments')
      .select('*')
      .eq('post_id', postId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    setAttachments((data ?? []) as AttachmentRow[])
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id ?? null

      const currentMax = Math.max(0, ...attachments.map((a) => a.display_order ?? 0))
      let nextOrder = currentMax + 1

      for (const file of Array.from(files)) {
        const validation = isAllowedAttachmentFileName(file.name)
        if (!validation.ok) {
          toast.error(`${file.name}: ${validation.reason}`)
          continue
        }

        const id = crypto.randomUUID()
        const ts = Date.now()
        const safe = safeFileName(file.name)
        const filePath = `${postId}/${ts}-${safe}`

        const { error: uploadError } = await supabase
          .storage
          .from('post-attachments')
          .upload(filePath, file, { upsert: false, contentType: file.type || undefined })

        if (uploadError) {
          toast.error(`${file.name}: ${uploadError.message}`)
          continue
        }

        const { error: insertError } = await supabase
          .from('post_attachments')
          .insert({
            id,
            post_id: postId,
            file_name: file.name,
            file_url: `/api/attachments/${id}/download`,
            file_path: filePath,
            file_type: file.type || validation.ext,
            file_size: file.size,
            uploaded_by: userId,
            display_order: nextOrder,
          })

        if (insertError) {
          // Roll back the storage object to avoid orphans.
          await supabase.storage.from('post-attachments').remove([filePath])
          toast.error(`${file.name}: ${insertError.message}`)
          continue
        }

        nextOrder += 1
      }

      await refresh()
      toast.success('Đã tải lên tệp đính kèm')
    } finally {
      setUploading(false)
    }
  }

  async function updateDescription(id: string, description: string) {
    const { error } = await supabase
      .from('post_attachments')
      .update({ description })
      .eq('id', id)
    if (error) toast.error(error.message)
  }

  async function move(id: string, direction: 'up' | 'down') {
    const index = attachments.findIndex((a) => a.id === id)
    if (index < 0) return
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= attachments.length) return

    const a = attachments[index]
    const b = attachments[swapWith]
    const orderA = a.display_order ?? index
    const orderB = b.display_order ?? swapWith

    const { error } = await supabase
      .from('post_attachments')
      .upsert([
        { id: a.id, display_order: orderB },
        { id: b.id, display_order: orderA },
      ])

    if (error) {
      toast.error(error.message)
      return
    }
    await refresh()
  }

  async function removeAttachment(att: AttachmentRow) {
    if (!confirm(`Xóa tệp "${att.file_name}"?`)) return

    if (att.file_path) {
      const { error: storageError } = await supabase
        .storage
        .from('post-attachments')
        .remove([att.file_path])
      if (storageError) {
        toast.error(storageError.message)
        return
      }
    }

    const { error } = await supabase
      .from('post_attachments')
      .delete()
      .eq('id', att.id)

    if (error) {
      toast.error(error.message)
      return
    }

    await refresh()
    toast.success('Đã xóa tệp đính kèm')
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-bold">Tài liệu tải về</h3>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ: .pdf, .docx, .xlsx, .pptx, .zip, .png, .jpg, .jpeg, .webp (không cho phép .html).
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {loading ? 'Đang tải…' : `${attachments.length} tệp`}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tải lên tệp</Label>
        <Input
          type="file"
          multiple
          disabled={uploading}
          accept=".pdf,.docx,.xlsx,.pptx,.zip,.png,.jpg,.jpeg,.webp"
          onChange={(e) => void uploadFiles(e.target.files)}
        />
      </div>

      {attachments.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">Chưa có tệp đính kèm.</p>
      )}

      {attachments.length > 0 && (
        <div className="space-y-3">
          {attachments.map((att, idx) => {
            const sizeLabel = formatBytes(att.file_size)
            const meta = [att.file_type, sizeLabel].filter(Boolean).join(' • ')
            return (
              <div key={att.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{att.file_name}</p>
                    {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground">Mô tả</Label>
                      <Textarea
                        defaultValue={att.description ?? ''}
                        rows={2}
                        className="mt-1"
                        onBlur={(e) => void updateDescription(att.id, e.target.value)}
                        placeholder="Ví dụ: File đề thi, lời giải, đáp án..."
                      />
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={idx === 0} onClick={() => void move(att.id, 'up')}>
                      Lên
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={idx === attachments.length - 1} onClick={() => void move(att.id, 'down')}>
                      Xuống
                    </Button>
                    <a
                      href={att.file_url}
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md border text-sm hover:bg-muted transition-colors"
                    >
                      Tải thử
                    </a>
                    <Button type="button" variant="destructive" size="sm" onClick={() => void removeAttachment(att)}>
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


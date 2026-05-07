import { formatBytes } from '@/lib/attachments/validation'

export interface PublicAttachment {
  id: string
  file_name: string
  file_url: string
  description: string | null
  file_size: number | null
  file_type: string | null
  download_count: number
}

const countFormatter = new Intl.NumberFormat('vi-VN')

export function PublicAttachmentsSection({
  attachments,
  prominent,
  isAuthenticated,
  currentPath,
}: {
  attachments: PublicAttachment[]
  prominent?: boolean
  isAuthenticated: boolean
  currentPath: string
}) {
  if (!attachments.length) return null

  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`

  return (
    <section className={prominent ? 'mt-6 rounded-xl border bg-white p-5' : 'mt-10 rounded-xl border bg-white p-5'}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold">Tài liệu tải về</h2>
        <p className="text-xs text-muted-foreground">{attachments.length} tệp</p>
      </div>

      <div className="mt-4 divide-y">
        {attachments.map((att) => {
          const sizeLabel = formatBytes(att.file_size)
          const meta = [att.file_type, sizeLabel].filter(Boolean).join(' • ')
          return (
            <div key={att.id} className="py-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="font-medium break-words">{att.file_name}</p>
                {att.description && <p className="mt-1 text-sm text-muted-foreground">{att.description}</p>}
                {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Đã tải: {countFormatter.format(att.download_count ?? 0)} lượt
                </p>
              </div>
              <div className="shrink-0">
                <a
                  href={isAuthenticated ? att.file_url : loginHref}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {isAuthenticated ? 'Tải xuống' : 'Đăng nhập để tải'}
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

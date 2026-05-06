const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'pptx', 'zip', 'png', 'jpg', 'jpeg', 'webp'] as const
const BLOCKED_ATTACHMENT_EXTENSIONS = ['exe', 'bat', 'cmd', 'msi', 'sh', 'js', 'jar', 'scr', 'php', 'html', 'htm'] as const

export type AllowedAttachmentExtension = typeof ALLOWED_ATTACHMENT_EXTENSIONS[number]

export function getFileExtension(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName
  const ext = base.split('.').pop()
  return (ext ?? '').toLowerCase()
}

export function isAllowedAttachmentFileName(fileName: string): { ok: true; ext: AllowedAttachmentExtension } | { ok: false; reason: string } {
  const ext = getFileExtension(fileName)
  if (!ext) return { ok: false, reason: 'Tệp không có phần mở rộng.' }
  if ((BLOCKED_ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, reason: `Không cho phép tệp .${ext}.` }
  }
  if (!(ALLOWED_ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, reason: `Chỉ hỗ trợ: ${ALLOWED_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(', ')}.` }
  }
  return { ok: true, ext: ext as AllowedAttachmentExtension }
}

export function safeFileName(input: string): string {
  const base = (input.split(/[\\/]/).pop() ?? input).trim()
  const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const cleaned = normalized
    .replace(/[^a-zA-Z0-9.\-_ ]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
  return cleaned || 'file'
}

export function formatBytes(bytes: number | null | undefined): string | null {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return null
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  const fixed = value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)
  return `${fixed} ${units[i]}`
}


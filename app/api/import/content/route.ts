import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeImportedHtml } from '@/lib/content/sanitize'
import { extractTextFromPdf } from '@/features/ai-assistant/pdfService'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['html', 'htm', 'docx', 'pdf']

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function textToSimpleHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

async function requireAuthorOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' || profile?.role === 'author'
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

async function extractFromFile(file: File): Promise<{ html: string; warnings: string[]; errors: string[] }> {
  const warnings: string[] = []
  const errors: string[] = []
  const extension = getExtension(file.name)

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      html: '',
      warnings,
      errors: extension === 'doc'
        ? ['Vui lòng chuyển tệp .doc sang .docx hoặc HTML trước khi nhập.']
        : ['Định dạng tệp không được hỗ trợ. Chỉ nhận .html, .htm, .docx, .pdf.'],
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { html: '', warnings, errors: ['Tệp vượt quá giới hạn 10 MB.'] }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (extension === 'html' || extension === 'htm') {
    return { html: buffer.toString('utf8'), warnings, errors }
  }

  if (extension === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.convertToHtml({ buffer })
    warnings.push('Công thức từ Word có thể cần kiểm tra lại. Nên dùng LaTeX dạng \\( ... \\) hoặc \\[ ... \\].')
    warnings.push('Ảnh trong DOCX có thể không được giữ nếu được nhúng dưới dạng dữ liệu không an toàn.')
    for (const message of result.messages ?? []) {
      if (message.message) warnings.push(message.message)
    }
    return { html: result.value, warnings, errors }
  }

  const parsed = await extractTextFromPdf(buffer)
  warnings.push('PDF chỉ được trích xuất tốt nhất có thể; bảng, cột, ảnh và công thức có thể bị mất.')
  if (parsed.wasTruncated) warnings.push('Nội dung PDF đã bị rút gọn do quá dài.')
  return { html: textToSimpleHtml(parsed.text), warnings, errors }
}

export async function POST(req: NextRequest) {
  const allowed = await requireAuthorOrAdmin()
  if (!allowed) {
    return NextResponse.json({ errors: ['Unauthorized'] }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') ?? ''
  let rawHtml = ''
  let warnings: string[] = []
  let errors: string[] = []

  try {
    if (contentType.includes('application/json')) {
      const body = await req.json()
      rawHtml = typeof body.html === 'string' ? body.html : ''
      if (!rawHtml.trim()) errors.push('HTML trống.')
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      if (!(file instanceof File)) {
        errors.push('Không tìm thấy tệp tải lên.')
      } else {
        const extracted = await extractFromFile(file)
        rawHtml = extracted.html
        warnings = extracted.warnings
        errors = extracted.errors
      }
    } else {
      errors.push('Content-Type không được hỗ trợ.')
    }
  } catch (error) {
    console.error('[POST /api/import/content] Import failed:', error)
    errors.push('Không thể xử lý nội dung nhập.')
  }

  if (errors.length > 0) {
    return NextResponse.json({ extractedHtml: '', warnings, errors }, { status: 400 })
  }

  const extractedHtml = sanitizeImportedHtml(rawHtml)
  return NextResponse.json({ extractedHtml, warnings, errors: [] })
}

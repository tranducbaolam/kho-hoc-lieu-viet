import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeImportedHtml } from '@/lib/content/sanitize'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['html', 'htm']

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
      errors: [
        'Định dạng tệp không được hỗ trợ cho nội dung bài viết. Chỉ nhận .html, .htm.',
        'PDF/DOCX chỉ được dùng làm tài liệu đính kèm để tải về (không trích xuất làm nội dung).',
      ],
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { html: '', warnings, errors: ['Tệp vượt quá giới hạn 10 MB.'] }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  return { html: buffer.toString('utf8'), warnings, errors }
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

'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import slugify from 'slugify'
import {
  Loader2, Check, ImageIcon, Tag, Settings2,
  Search, BarChart3, ChevronLeft, Globe, Send, BookOpen, ExternalLink, ArrowUp,
  GraduationCap, FileText, Code2, Upload, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Editor } from '@/components/editor/Editor'
import { EditorContent } from '@/components/editor/EditorContent'
import { createPost, updatePost, publishPost, unpublishPost } from '@/features/posts/actions'
import type {
  PostWithRelations,
  Category,
  Tag as TagType,
  EducationGrade,
  EducationSubject,
} from '@/features/posts/types'
import type { ChapterWithRelations, ContentType, Difficulty } from '@/features/education/types'
import { CONTENT_TYPE_LABELS, DIFFICULTY_LABELS } from '@/features/education/types'

const postSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  cover_image: z.string(),
  category_id: z.string(),
  content_type: z.enum(['lesson', 'solution', 'exercise', 'exam', 'news']),
  grade_id: z.string(),
  subject_id: z.string(),
  chapter_id: z.string(),
  lesson_order: z.coerce.number().int().default(0),
  difficulty: z.enum(['easy', 'medium', 'hard', 'advanced']).or(z.literal('')),
  exam_type: z.string(),
  exam_year: z.preprocess(
    (value) => (value === '' || value == null || Number.isNaN(value) ? null : Number(value)),
    z.number().int().nullable()
  ),
  school_name: z.string(),
  province: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  tag_ids: z.array(z.string()),
})

type PostFormValues = z.infer<typeof postSchema>

interface PostEditorProps {
  readonly post?: PostWithRelations
  readonly categories: Category[]
  readonly tags: TagType[]
  readonly educationGrades?: EducationGrade[]
  readonly educationSubjects?: EducationSubject[]
  readonly educationChapters?: ChapterWithRelations[]
}

// Deterministic color palette for tags — muted, sophisticated hues
const TAG_PALETTES = [
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', activeBg: 'bg-rose-500', activeText: 'text-white', activeBorder: 'border-rose-500', dot: 'bg-rose-400' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', activeBg: 'bg-violet-500', activeText: 'text-white', activeBorder: 'border-violet-500', dot: 'bg-violet-400' },
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', activeBg: 'bg-sky-500', activeText: 'text-white', activeBorder: 'border-sky-500', dot: 'bg-sky-400' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', activeBg: 'bg-emerald-500', activeText: 'text-white', activeBorder: 'border-emerald-500', dot: 'bg-emerald-400' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', activeBg: 'bg-amber-500', activeText: 'text-white', activeBorder: 'border-amber-500', dot: 'bg-amber-400' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', activeBg: 'bg-pink-500', activeText: 'text-white', activeBorder: 'border-pink-500', dot: 'bg-pink-400' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', activeBg: 'bg-indigo-500', activeText: 'text-white', activeBorder: 'border-indigo-500', dot: 'bg-indigo-400' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', activeBg: 'bg-teal-500', activeText: 'text-white', activeBorder: 'border-teal-500', dot: 'bg-teal-400' },
]

function getTagPalette(index: number) {
  return TAG_PALETTES[index % TAG_PALETTES.length]
}

function isTipTapJson(value: string): boolean {
  try {
    const parsed = JSON.parse(value)
    return Boolean(parsed && typeof parsed === 'object' && parsed.type === 'doc')
  } catch {
    return false
  }
}

const CONTENT_TYPES = Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]
const DIFFICULTIES = Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]

export function PostEditor({
  post,
  categories,
  tags,
  educationGrades = [],
  educationSubjects = [],
  educationChapters = [],
}: PostEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [editorMode, setEditorMode] = useState<'rich' | 'html' | 'file'>('rich')
  const [htmlDraft, setHtmlDraft] = useState(post?.content && !isTipTapJson(post.content) ? post.content : '')
  const [previewHtml, setPreviewHtml] = useState('')
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [selectedFileInfo, setSelectedFileInfo] = useState('')

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 300)
    }
    const options: AddEventListenerOptions = { passive: true }
    window.addEventListener('scroll', onScroll, options)
    return () => window.removeEventListener('scroll', onScroll, options)
  }, [])

  const isPublished = post?.status === 'published'

  const { register, handleSubmit, control, setValue, watch, getValues, formState: { errors } } =
    useForm<PostFormValues>({
      resolver: zodResolver(postSchema),
      defaultValues: {
        title: post?.title ?? '',
        slug: post?.slug ?? '',
        excerpt: post?.excerpt ?? '',
        content: post?.content ?? '',
        cover_image: post?.cover_image ?? '',
        category_id: post?.category_id ?? '',
        content_type: (post?.content_type as ContentType | null) ?? 'lesson',
        grade_id: post?.grade_id ?? '',
        subject_id: post?.subject_id ?? '',
        chapter_id: post?.chapter_id ?? '',
        lesson_order: post?.lesson_order ?? 0,
        difficulty: (post?.difficulty as Difficulty | null) ?? '',
        exam_type: post?.exam_type ?? '',
        exam_year: post?.exam_year ?? null,
        school_name: post?.school_name ?? '',
        province: post?.province ?? '',
        seo_title: post?.seo_title ?? '',
        seo_description: post?.seo_description ?? '',
        tag_ids: post?.tags?.map((t) => t.id) ?? [],
      },
    })

  const title = watch('title')
  const coverImage = watch('cover_image')
  const selectedTagIds = watch('tag_ids')
  const contentType = watch('content_type')
  const selectedGradeId = watch('grade_id')
  const selectedSubjectId = watch('subject_id')
  const availableChapters = educationChapters.filter((chapter) => (
    (!selectedGradeId || chapter.grade_id === selectedGradeId) &&
    (!selectedSubjectId || chapter.subject_id === selectedSubjectId)
  ))

  function autoSlug() {
    if (!title) return
    setValue('slug', slugify(title, { lower: true, strict: true }))
  }

  function toggleTag(tagId: string) {
    const current = selectedTagIds ?? []
    if (current.includes(tagId)) {
      setValue('tag_ids', current.filter((id) => id !== tagId))
    } else {
      setValue('tag_ids', [...current, tagId])
    }
  }

  async function sanitizeHtmlPreview(sourceHtml: string) {
    if (!sourceHtml.trim()) {
      toast.error('Vui lòng nhập HTML trước khi xem trước')
      return
    }

    setImporting(true)
    setImportErrors([])
    setImportWarnings([])
    try {
      const res = await fetch('/api/import/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: sourceHtml }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setImportErrors(payload.errors ?? [payload.error ?? 'Không thể xử lý HTML'])
        return
      }
      setHtmlDraft(payload.extractedHtml ?? '')
      setPreviewHtml(payload.extractedHtml ?? '')
      setImportWarnings(payload.warnings ?? [])
      setValue('content', payload.extractedHtml ?? '', { shouldDirty: true })
      toast.success('HTML đã được làm sạch')
    } catch {
      setImportErrors(['Không thể kết nối tới trình nhập nội dung'])
    } finally {
      setImporting(false)
    }
  }

  async function handleFileImport(file: File | null) {
    if (!file) return
    setSelectedFileInfo(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    setImportErrors([])
    setImportWarnings([])

    const formData = new FormData()
    formData.append('file', file)

    setImporting(true)
    try {
      const res = await fetch('/api/import/content', {
        method: 'POST',
        body: formData,
      })
      const payload = await res.json()
      if (!res.ok) {
        setImportErrors(payload.errors ?? [payload.error ?? 'Không thể nhập tệp'])
        return
      }
      setHtmlDraft(payload.extractedHtml ?? '')
      setPreviewHtml(payload.extractedHtml ?? '')
      setImportWarnings(payload.warnings ?? [])
      setValue('content', payload.extractedHtml ?? '', { shouldDirty: true })
      setEditorMode('html')
      toast.success('Đã trích xuất nội dung. Vui lòng kiểm tra trước khi lưu.')
    } catch {
      setImportErrors(['Không thể tải tệp lên để xử lý'])
    } finally {
      setImporting(false)
    }
  }

  function updateHtmlDraft(value: string) {
    setHtmlDraft(value)
    setValue('content', value, { shouldDirty: true })
  }

  async function onSubmit(values: PostFormValues) {
    setSaving(true)
    const result = post
      ? await updatePost(post.id, values)
      : await createPost(values)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(post ? 'Đã lưu bản nháp' : 'Đã lưu bài mới dưới dạng bản nháp')
      if (!post && result.data) {
        router.push(`/dashboard/posts/${result.data.id}/edit`)
      }
    }
    setSaving(false)
  }

  async function handlePublishToggle() {
    if (!post) return
    setPublishing(true)

    if (isPublished) {
      const result = await unpublishPost(post.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Đã gỡ đăng bài viết')
        router.refresh()
      }
    } else {
      // Save current form values first, then publish.
      const saveResult = await updatePost(post.id, getValues())
      if (saveResult.error) {
        toast.error(saveResult.error)
        setPublishing(false)
        return
      }
      const publishResult = await publishPost(post.id)
      if (publishResult.error) {
        toast.error(publishResult.error)
      } else {
        toast.success('Đã lưu và đăng bài viết')
        router.refresh()
      }
    }

    setPublishing(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Sticky action bar ───────────────────────────────────── */}
        <div className="sticky top-0 z-20 -mx-4 px-4 md:-mx-8 md:px-8 py-3 mb-6 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/dashboard/posts')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Tất cả bài viết
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/posts')}
              className="text-muted-foreground"
              disabled={saving || publishing}
            >
              Hủy
            </Button>

            {/* View published post */}
            {post && isPublished && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                disabled={saving || publishing}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Xem bài
              </Button>
            )}

            {/* Save — only for existing posts */}
            {post && (
              <Button
                type="submit"
                disabled={saving || publishing}
                size="sm"
                variant="outline"
                className="border-border/70 hover:-translate-y-px transition-all duration-150 px-4 min-w-[110px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                    {isPublished ? 'Lưu thay đổi' : 'Lưu bản nháp'}
                  </>
                )}
              </Button>
            )}

            {/* Publish / Unpublish — only shown for existing posts */}
            {post && (
              <Button
                type="button"
                disabled={saving || publishing}
                size="sm"
                onClick={handlePublishToggle}
                className={
                  isPublished
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm shadow-amber-500/25 hover:-translate-y-px transition-all duration-150 px-5 min-w-[130px]'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-sm shadow-blue-500/25 hover:-translate-y-px transition-all duration-150 px-5 min-w-[130px]'
                }
              >
                {publishing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {isPublished ? 'Đang gỡ đăng...' : 'Đang đăng...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    {isPublished ? 'Gỡ đăng' : 'Đăng bài'}
                  </>
                )}
              </Button>
            )}

            {/* New post — single publish button */}
            {!post && (
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-sm shadow-blue-500/25 hover:-translate-y-px transition-all duration-150 px-5 min-w-[130px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Thêm bài
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ── Main layout ─────────────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_292px]">

          {/* Left: writing area */}
          <div className="space-y-5 min-w-0">

            {/* Title */}
            <div className="space-y-1">
              <input
                {...register('title')}
                onBlur={autoSlug}
                placeholder="Tiêu đề bài học, lời giải hoặc đề thi..."
                className="w-full text-3xl font-bold tracking-tight bg-transparent border-0 outline-none placeholder:text-muted-foreground/40 text-foreground resize-none leading-tight"
              />
              {errors.title && (
                <p className="text-xs text-destructive pl-0.5">{errors.title.message}</p>
              )}
            </div>

            {/* Slug row */}
            <div className="flex items-center gap-2 py-2 border-y border-dashed border-border/70">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">slug /</span>
              <input
                {...register('slug')}
                placeholder="auto-generated-from-title"
                className="flex-1 text-xs text-muted-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground/40 font-mono"
                onChange={(e) => {
                  const formatted = slugify(e.target.value, { lower: true, strict: true })
                  setValue('slug', formatted)
                }}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Tóm tắt
              </Label>
              <Textarea
                {...register('excerpt')}
                placeholder="Mô tả ngắn hiển thị trong danh sách bài viết và kết quả tìm kiếm..."
                rows={3}
                className="resize-none text-sm leading-relaxed bg-muted/30 border-border/60 focus-visible:border-blue-400/60 focus-visible:ring-blue-400/20 placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Education classification */}
            <div className="rounded-lg border border-border/70 bg-white p-4 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Phân loại giáo dục
                </Label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Loại nội dung</Label>
                  <select {...register('content_type')} className="w-full h-9 rounded-md border border-border/60 bg-muted/30 px-3 text-sm">
                    {CONTENT_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Thứ tự bài</Label>
                  <Input type="number" {...register('lesson_order', { valueAsNumber: true })} className="h-9 bg-muted/30 border-border/60" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Lớp học</Label>
                  <select {...register('grade_id')} className="w-full h-9 rounded-md border border-border/60 bg-muted/30 px-3 text-sm">
                    <option value="">Chọn lớp...</option>
                    {educationGrades.map((grade) => (
                      <option key={grade.id} value={grade.id}>{grade.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Môn học</Label>
                  <select {...register('subject_id')} className="w-full h-9 rounded-md border border-border/60 bg-muted/30 px-3 text-sm">
                    <option value="">Chọn môn...</option>
                    {educationSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Chương / chuyên đề</Label>
                  <select {...register('chapter_id')} className="w-full h-9 rounded-md border border-border/60 bg-muted/30 px-3 text-sm">
                    <option value="">Chọn chương...</option>
                    {availableChapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.grade?.name ?? 'Lớp'} / {chapter.subject?.name ?? 'Môn'} / {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Độ khó</Label>
                  <select {...register('difficulty')} className="w-full h-9 rounded-md border border-border/60 bg-muted/30 px-3 text-sm">
                    <option value="">Không chọn</option>
                    {DIFFICULTIES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {contentType === 'exam' && (
                <div className="grid gap-3 md:grid-cols-2 border-t pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Loại đề thi</Label>
                    <Input {...register('exam_type')} placeholder="Học kỳ, tuyển sinh, kiểm tra..." className="h-9 bg-muted/30 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Năm thi</Label>
                    <Input type="number" {...register('exam_year', { valueAsNumber: true })} className="h-9 bg-muted/30 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Trường</Label>
                    <Input {...register('school_name')} placeholder="Tên trường..." className="h-9 bg-muted/30 border-border/60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tỉnh / thành</Label>
                    <Input {...register('province')} placeholder="Hà Nội, TP.HCM..." className="h-9 bg-muted/30 border-border/60" />
                  </div>
                </div>
              )}
            </div>

            {/* Content editor */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Nội dung
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'rich' as const, label: 'Soạn thảo', icon: FileText },
                  { value: 'html' as const, label: 'Nhập HTML', icon: Code2 },
                  { value: 'file' as const, label: 'Nhập tệp', icon: Upload },
                ].map((mode) => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setEditorMode(mode.value)}
                      className={[
                        'inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-medium transition-colors',
                        editorMode === mode.value
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-border bg-white text-muted-foreground hover:bg-muted',
                      ].join(' ')}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mode.label}
                    </button>
                  )
                })}
              </div>

              {editorMode === 'rich' && (
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <Editor value={field.value} onChange={field.onChange} />
                  )}
                />
              )}

              {editorMode === 'html' && (
                <div className="grid gap-3">
                  <Textarea
                    value={htmlDraft}
                    onChange={(event) => updateHtmlDraft(event.target.value)}
                    rows={14}
                    placeholder="<section class=&quot;lesson-theory&quot;>...</section>"
                    className="font-mono text-xs leading-relaxed bg-muted/30 border-border/60"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => sanitizeHtmlPreview(htmlDraft)}>
                      {importing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                      Xem trước & làm sạch
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      HTML sẽ được làm sạch trước khi lưu và trước khi hiển thị công khai.
                    </p>
                  </div>
                </div>
              )}

              {editorMode === 'file' && (
                <div className="rounded-lg border border-dashed border-border p-5 bg-muted/20 space-y-3">
                  <Input
                    type="file"
                    accept=".html,.htm,.docx,.pdf"
                    onChange={(event) => handleFileImport(event.target.files?.[0] ?? null)}
                  />
                  {selectedFileInfo && <p className="text-xs text-muted-foreground">{selectedFileInfo}</p>}
                  <p className="text-xs text-muted-foreground">
                    HTML là định dạng khuyến nghị. DOCX cần kiểm tra lại công thức. PDF chỉ trích xuất tốt nhất có thể và có thể mất bảng, ảnh, công thức.
                  </p>
                </div>
              )}

              {(importWarnings.length > 0 || importErrors.length > 0) && (
                <div className="space-y-1 text-xs">
                  {importWarnings.map((warning) => (
                    <p key={warning} className="text-amber-700">{warning}</p>
                  ))}
                  {importErrors.map((error) => (
                    <p key={error} className="text-destructive">{error}</p>
                  ))}
                </div>
              )}

              {previewHtml && (
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Bản xem trước đã làm sạch</p>
                  <EditorContent content={previewHtml} />
                </div>
              )}
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">

            {/* ── Settings card ──────────────────────────── */}
            <SidebarCard icon={Settings2} title="Thiết lập">
              {/* Cover image */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ảnh đại diện</Label>
                {coverImage && (
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-muted mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Xem trước ảnh đại diện"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    {...register('cover_image')}
                    placeholder="https://…"
                    className="pl-9 text-sm h-9 bg-muted/30 border-border/60"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Chuyên mục phụ</Label>
                <select
                  {...register('category_id')}
                  className="w-full h-9 rounded-md border border-border/60 bg-muted/30 px-3 py-1 text-sm shadow-none focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-colors"
                >
                  <option value="">Chọn chuyên mục...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </SidebarCard>

            {/* ── Tags card ──────────────────────────────── */}
            <SidebarCard icon={Tag} title="Thẻ">
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">Chưa có thẻ.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => {
                    const palette = getTagPalette(i)
                    const isSelected = selectedTagIds?.includes(tag.id)

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={[
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 select-none cursor-pointer',
                          isSelected
                            ? `${palette.activeBg} ${palette.activeText} ${palette.activeBorder} shadow-sm scale-[1.03]`
                            : `${palette.bg} ${palette.text} ${palette.border} hover:scale-[1.03] hover:shadow-sm`,
                        ].join(' ')}
                      >
                        {isSelected
                          ? <Check className="h-3 w-3 shrink-0" />
                          : <span className={`h-1.5 w-1.5 rounded-full ${palette.dot} shrink-0`} />
                        }
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedTagIds && selectedTagIds.length > 0 && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Đã chọn {selectedTagIds.length} thẻ
                </p>
              )}
            </SidebarCard>

            {/* ── SEO card ───────────────────────────────── */}
            <SidebarCard icon={BarChart3} title="SEO">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tiêu đề SEO</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    {...register('seo_title')}
                    placeholder="Ghi đè tiêu đề trên công cụ tìm kiếm..."
                    className="pl-9 text-sm h-9 bg-muted/30 border-border/60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Mô tả SEO</Label>
                <Textarea
                  {...register('seo_description')}
                  placeholder="Tóm tắt ngắn cho kết quả tìm kiếm..."
                  rows={3}
                  className="resize-none text-sm leading-relaxed bg-muted/30 border-border/60 focus-visible:border-blue-400/60 focus-visible:ring-blue-400/20 placeholder:text-muted-foreground/40"
                />
              </div>
            </SidebarCard>
          </div>
        </div>
      </form>
      {showBackToTop && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-md"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}

// ── Shared sidebar card shell ──────────────────────────────────────────────────
function SidebarCard({
  icon: Icon,
  title,
  children,
}: {
  readonly icon: React.ElementType
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/20">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

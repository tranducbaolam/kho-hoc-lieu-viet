import { NextResponse } from 'next/server'
import {
  validateApiKey,
  resolveTagIds,
  resolveCategoryId,
  generateUniqueSlugForApi,
} from '@/features/api-keys/apiKeyService'
import { createServiceClient } from '@/lib/supabase/service'
import { maybeSanitizeHtmlContent } from '@/lib/content/sanitize'

type PostBody = {
  title: string
  content: string
  slug?: string
  status?: string
  excerpt?: string
  meta_title?: string
  meta_description?: string
  tags?: string[]
  category?: string
  image_url?: string
  content_type?: string
  grade_id?: string
  subject_id?: string
  chapter_id?: string
  lesson_order?: number
  difficulty?: string
  exam_type?: string
  exam_year?: number
  school_name?: string
  province?: string
}

function parsePostBody(raw: Record<string, unknown>): { body: PostBody } | { error: string } {
  const { title, content } = raw
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { error: 'title is required' }
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return { error: 'content is required' }
  }
  return { body: raw as unknown as PostBody }
}

function buildPostPayload(body: PostBody, slug: string, categoryId: string | null, userId: string) {
  const postStatus = body.status === 'published' ? 'published' : 'draft'
  const seoDescription = typeof body.meta_description === 'string'
    ? body.meta_description
    : (typeof body.excerpt === 'string' ? body.excerpt : null)

  return {
    title: body.title.trim(),
    slug,
    content: maybeSanitizeHtmlContent(body.content),
    excerpt: typeof body.excerpt === 'string' ? body.excerpt : null,
    cover_image: typeof body.image_url === 'string' ? body.image_url : null,
    status: postStatus,
    author_id: userId,
    category_id: categoryId,
    content_type: ['lesson', 'solution', 'exercise', 'exam', 'news'].includes(body.content_type ?? '') ? body.content_type : 'lesson',
    grade_id: typeof body.grade_id === 'string' ? body.grade_id : null,
    subject_id: typeof body.subject_id === 'string' ? body.subject_id : null,
    chapter_id: typeof body.chapter_id === 'string' ? body.chapter_id : null,
    lesson_order: typeof body.lesson_order === 'number' ? body.lesson_order : 0,
    difficulty: ['easy', 'medium', 'hard', 'advanced'].includes(body.difficulty ?? '') ? body.difficulty : null,
    exam_type: typeof body.exam_type === 'string' ? body.exam_type : null,
    exam_year: typeof body.exam_year === 'number' ? body.exam_year : null,
    school_name: typeof body.school_name === 'string' ? body.school_name : null,
    province: typeof body.province === 'string' ? body.province : null,
    seo_title: typeof body.meta_title === 'string' ? body.meta_title : body.title.trim(),
    seo_description: seoDescription,
    published_at: postStatus === 'published' ? new Date().toISOString() : null,
  }
}

async function insertPostWithTags(
  supabase: ReturnType<typeof createServiceClient>,
  payload: ReturnType<typeof buildPostPayload>,
  tags: string[] | undefined
) {
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert(payload)
    .select()
    .single()

  if (postError) {
    console.error('[API] Failed to insert post:', postError.message)
    return { post: null, error: 'Failed to create post' }
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const tagNames = tags.filter((t) => typeof t === 'string' && t.trim())
    const tagIds = await resolveTagIds(tagNames, supabase)
    if (tagIds.length > 0) {
      const { error: postTagsError } = await supabase
        .from('post_tags')
        .insert(tagIds.map((tag_id) => ({ post_id: post.id, tag_id })))

      if (postTagsError) {
        console.error('[API] Failed to insert post tags:', postTagsError.message)
        return { post: null, error: 'Failed to create post tags' }
      }
    }
  }

  return { post, error: null }
}

export async function POST(request: Request) {
  // 1. Authenticate via API key
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const userId = await validateApiKey(authHeader.slice(7))
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Invalid or revoked API key' }, { status: 401 })
  }

  // 2. Parse and validate body
  let rawBody: Record<string, unknown>
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parsePostBody(rawBody)
  if ('error' in parsed) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
  }
  const body = parsed.body

  // 3. Resolve slug and category
  const supabase = createServiceClient()
  const resolvedSlug = (typeof body.slug === 'string' && body.slug.trim())
    ? body.slug.trim()
    : await generateUniqueSlugForApi(body.title, supabase)
  const categoryId = body.category ? await resolveCategoryId(body.category, supabase) : null

  // 4. Insert post with tags
  const payload = buildPostPayload(body, resolvedSlug, categoryId, userId)
  const { post, error } = await insertPostWithTags(supabase, payload, body.tags)

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { post } }, { status: 201 })
}

import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

type SitemapChapter = {
  slug: string
  updated_at: string
  grade: { slug: string } | null
  subject: { slug: string } | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at, content_type')
    .eq('status', 'published')

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')

  const { data: tags } = await supabase
    .from('tags')
    .select('slug, created_at')

  const { data: grades } = await supabase
    .from('education_grades')
    .select('slug, updated_at')

  const { data: chapters } = await supabase
    .from('education_chapters')
    .select(`
      slug,
      updated_at,
      grade:education_grades(slug),
      subject:education_subjects(slug)
    `)

  const postUrls: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${siteUrl}/hoc/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const legacyPostUrls: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.45,
  }))

  const examUrls: MetadataRoute.Sitemap = (posts ?? [])
    .filter((post) => post.content_type === 'exam')
    .map((post) => ({
      url: `${siteUrl}/de-thi/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

  const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
    url: `${siteUrl}/blog/category/${cat.slug}`,
    lastModified: new Date(cat.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const tagUrls: MetadataRoute.Sitemap = (tags ?? []).map((tag) => ({
    url: `${siteUrl}/blog/tag/${tag.slug}`,
    lastModified: new Date(tag.created_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const gradeUrls: MetadataRoute.Sitemap = (grades ?? []).map((grade) => ({
    url: `${siteUrl}/lop/${grade.slug}`,
    lastModified: new Date(grade.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const chapterRows = (chapters ?? []) as unknown as SitemapChapter[]

  const chapterUrls: MetadataRoute.Sitemap = chapterRows
    .filter((chapter) => chapter.grade?.slug && chapter.subject?.slug)
    .map((chapter) => ({
      url: `${siteUrl}/lop/${chapter.grade!.slug}/${chapter.subject!.slug}/${chapter.slug}`,
      lastModified: new Date(chapter.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/de-thi`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/tim-kiem`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    ...postUrls,
    ...legacyPostUrls,
    ...examUrls,
    ...gradeUrls,
    ...chapterUrls,
    ...categoryUrls,
    ...tagUrls,
  ]
}

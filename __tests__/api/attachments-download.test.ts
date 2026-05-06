import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockCreateClient = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

import { GET } from '@/app/api/attachments/[id]/download/route'

type MockUser = {
  id: string
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}

type MockProfile = {
  role: 'admin' | 'user' | string
}

type MockAttachment = {
  id: string
  post_id: string
  file_path: string
  file_name: string
}

function makeRequest(url: string, referer?: string) {
  return new NextRequest(url, {
    headers: referer ? { referer } : undefined,
  })
}

function makeContext(id = 'attachment-1') {
  return { params: Promise.resolve({ id }) }
}

function makeSupabaseMock({
  user,
  profile,
  attachment,
  post,
  signedUrl = 'https://storage.example/signed-file',
}: {
  user: MockUser | null
  profile?: MockProfile | null
  attachment?: MockAttachment | null
  post?: { status: string } | null
  signedUrl?: string
}) {
  const profileSingle = vi.fn().mockResolvedValue({ data: profile ?? null, error: null })
  const attachmentSingle = vi.fn().mockResolvedValue({
    data: attachment ?? null,
    error: attachment ? null : { message: 'not found' },
  })
  const postSingle = vi.fn().mockResolvedValue({
    data: post ?? null,
    error: post ? null : { message: 'not found' },
  })

  const singles: Record<string, ReturnType<typeof vi.fn>> = {
    profiles: profileSingle,
    post_attachments: attachmentSingle,
    posts: postSingle,
  }

  const from = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: singles[table],
      })),
    })),
  }))

  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl },
    error: null,
  })

  return {
    createSignedUrl,
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      },
      from,
      storage: {
        from: vi.fn(() => ({ createSignedUrl })),
      },
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/attachments/[id]/download', () => {
  it('redirects anonymous visitors to login with next from the article referer', async () => {
    const { supabase } = makeSupabaseMock({ user: null })
    mockCreateClient.mockResolvedValue(supabase)

    const response = await GET(
      makeRequest('http://localhost/api/attachments/attachment-1/download', 'http://localhost/hoc/can-bac-hai'),
      makeContext()
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost/login?next=%2Fhoc%2Fcan-bac-hai')
  })

  it('redirects authenticated users to a signed URL for published post attachments', async () => {
    const { supabase, createSignedUrl } = makeSupabaseMock({
      user: { id: 'user-1', email_confirmed_at: '2026-05-07T00:00:00Z' },
      profile: { role: 'user' },
      attachment: {
        id: 'attachment-1',
        post_id: 'post-1',
        file_path: 'post-1/file.pdf',
        file_name: 'file.pdf',
      },
      post: { status: 'published' },
      signedUrl: 'https://storage.example/signed-file',
    })
    mockCreateClient.mockResolvedValue(supabase)

    const response = await GET(
      makeRequest('http://localhost/api/attachments/attachment-1/download'),
      makeContext()
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://storage.example/signed-file')
    expect(createSignedUrl).toHaveBeenCalledWith('post-1/file.pdf', 60 * 5, {
      download: 'file.pdf',
    })
  })

  it('does not allow normal users to download draft post attachments', async () => {
    const { supabase, createSignedUrl } = makeSupabaseMock({
      user: { id: 'user-1', email_confirmed_at: '2026-05-07T00:00:00Z' },
      profile: { role: 'user' },
      attachment: {
        id: 'attachment-1',
        post_id: 'post-1',
        file_path: 'post-1/draft.pdf',
        file_name: 'draft.pdf',
      },
      post: { status: 'draft' },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const response = await GET(
      makeRequest('http://localhost/api/attachments/attachment-1/download'),
      makeContext()
    )

    expect(response.status).toBe(404)
    expect(createSignedUrl).not.toHaveBeenCalled()
  })

  it('allows admins to download draft post attachments', async () => {
    const { supabase, createSignedUrl } = makeSupabaseMock({
      user: { id: 'admin-1', email_confirmed_at: '2026-05-07T00:00:00Z' },
      profile: { role: 'admin' },
      attachment: {
        id: 'attachment-1',
        post_id: 'post-1',
        file_path: 'post-1/admin-draft.pdf',
        file_name: 'admin-draft.pdf',
      },
      post: { status: 'draft' },
      signedUrl: 'https://storage.example/admin-signed-file',
    })
    mockCreateClient.mockResolvedValue(supabase)

    const response = await GET(
      makeRequest('http://localhost/api/attachments/attachment-1/download'),
      makeContext()
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://storage.example/admin-signed-file')
    expect(createSignedUrl).toHaveBeenCalled()
  })
})

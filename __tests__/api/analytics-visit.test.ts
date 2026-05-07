import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockCreateClient = vi.hoisted(() => vi.fn())
const mockInsert = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: vi.fn(() => ({ insert: mockInsert })),
  }),
}))

import { POST } from '@/app/api/analytics/visit/route'

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/analytics/visit', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })
})

describe('POST /api/analytics/visit', () => {
  it('logs article visits with hashed IP and authenticated user id', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
              email_confirmed_at: '2026-05-07T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    })

    const response = await POST(makeRequest(
      { path: '/hoc/can-bac-hai' },
      {
        'x-forwarded-for': '203.0.113.10, 198.51.100.2',
        'x-vercel-ip-country': 'VN',
        'x-vercel-ip-city': 'Ho%20Chi%20Minh',
        'user-agent': 'Vitest Browser',
      }
    ))

    expect(response.status).toBe(201)
    expect(mockInsert).toHaveBeenCalledTimes(1)
    const row = mockInsert.mock.calls[0][0]
    expect(row).toMatchObject({
      path: '/hoc/can-bac-hai',
      user_agent: 'Vitest Browser',
      country: 'VN',
      city: 'Ho Chi Minh',
      user_id: 'user-1',
    })
    expect(row.ip_hash).toHaveLength(64)
    expect(row.ip_hash).not.toContain('203.0.113.10')
  })

  it('logs anonymous article visits without a user id', async () => {
    const response = await POST(makeRequest(
      { path: '/hoc/bai-hoc' },
      { 'x-real-ip': '203.0.113.20' }
    ))

    expect(response.status).toBe(201)
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      path: '/hoc/bai-hoc',
      user_id: null,
      ip_hash: expect.any(String),
    }))
  })

  it('rejects non-article paths without inserting', async () => {
    const response = await POST(makeRequest({ path: '/dashboard' }))

    expect(response.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

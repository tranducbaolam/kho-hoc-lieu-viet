import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(auth)/login/actions', () => ({
  login: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  }),
}))

import LoginForm from '@/components/auth/LoginForm'

describe('LoginForm (Google OAuth)', () => {
  it('shows Google login button', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: 'Đăng nhập bằng Google' })).toBeInTheDocument()
  })
})


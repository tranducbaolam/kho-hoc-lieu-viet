import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(auth)/login/actions', () => ({
  login: vi.fn(),
}))

import LoginForm from '@/components/auth/LoginForm'

describe('LoginForm Google OAuth', () => {
  it('does not show Google login button', () => {
    render(<LoginForm />)
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
  })
})

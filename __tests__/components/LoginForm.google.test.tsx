import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockPush = vi.hoisted(() => vi.fn())
const mockLogin = vi.hoisted(() => vi.fn())
const mockSignInWithOAuth = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/app/(auth)/login/actions', () => ({
  login: mockLogin,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}))

import LoginForm from '@/components/auth/LoginForm'

function submitLoginForm() {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'user@example.com' },
  })
  fireEvent.change(document.querySelector('input[type="password"]') as HTMLInputElement, {
    target: { value: 'secret123' },
  })
  fireEvent.submit(document.querySelector('form') as HTMLFormElement)
}

beforeEach(() => {
  mockPush.mockClear()
  mockLogin.mockReset()
  mockLogin.mockResolvedValue({ success: true })
  mockSignInWithOAuth.mockReset()
  mockSignInWithOAuth.mockResolvedValue({ error: null })
})

describe('LoginForm Google OAuth', () => {
  it('does not show Facebook login button', () => {
    render(<LoginForm />)
    expect(screen.queryByRole('button', { name: /facebook/i })).not.toBeInTheDocument()
  })

  it('shows Google login button', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: 'Đăng nhập bằng Google' })).toBeInTheDocument()
  })

  it('starts Google OAuth with Supabase', async () => {
    render(<LoginForm />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' }))

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    })
  })

  it('shows a Vietnamese error if Google OAuth cannot start', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: 'OAuth error' } })
    render(<LoginForm />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập bằng Google' }))

    expect(await screen.findByText('Không thể đăng nhập bằng Google. Vui lòng thử lại.')).toBeInTheDocument()
  })

  it('keeps email and password login working', async () => {
    render(<LoginForm />)

    submitLoginForm()

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to a safe internal next path after login', async () => {
    render(<LoginForm nextPath="/hoc/bai-hoc?from=download" />)

    submitLoginForm()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/hoc/bai-hoc?from=download')
    })
  })

  it('rejects an external next URL after login', async () => {
    render(<LoginForm nextPath="https://evil.example/phishing" />)

    submitLoginForm()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})

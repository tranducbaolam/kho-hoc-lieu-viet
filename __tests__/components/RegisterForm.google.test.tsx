import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockRegister = vi.hoisted(() => vi.fn())
const mockSignInWithOAuth = vi.hoisted(() => vi.fn())

vi.mock('@/app/(auth)/register/actions', () => ({
  register: mockRegister,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}))

import RegisterForm from '@/components/auth/RegisterForm'

function submitRegisterForm() {
  fireEvent.change(screen.getByLabelText('Họ tên'), {
    target: { value: 'Nguyen Van A' },
  })
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'user@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), {
    target: { value: 'secret123' },
  })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
    target: { value: 'secret123' },
  })
  fireEvent.submit(document.querySelector('form') as HTMLFormElement)
}

beforeEach(() => {
  mockRegister.mockReset()
  mockRegister.mockResolvedValue({ needsConfirmation: true })
  mockSignInWithOAuth.mockReset()
  mockSignInWithOAuth.mockResolvedValue({ error: null })
})

describe('RegisterForm Google OAuth', () => {
  it('does not show Facebook signup button', () => {
    render(<RegisterForm />)
    expect(screen.queryByRole('button', { name: /facebook/i })).not.toBeInTheDocument()
  })

  it('shows Google signup button', () => {
    render(<RegisterForm />)
    expect(screen.getByRole('button', { name: 'Tạo tài khoản bằng Google' })).toBeInTheDocument()
  })

  it('starts Google OAuth with Supabase', async () => {
    render(<RegisterForm />)

    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản bằng Google' }))

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    })
  })

  it('keeps email and password registration working', async () => {
    render(<RegisterForm />)

    submitRegisterForm()

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled()
    })
  })
})

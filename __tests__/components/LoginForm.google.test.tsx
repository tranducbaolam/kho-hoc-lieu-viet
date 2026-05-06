import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const mockPush = vi.hoisted(() => vi.fn())
const mockLogin = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/app/(auth)/login/actions', () => ({
  login: mockLogin,
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
})

describe('LoginForm Google OAuth', () => {
  it('does not show Google login button', () => {
    render(<LoginForm />)
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
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

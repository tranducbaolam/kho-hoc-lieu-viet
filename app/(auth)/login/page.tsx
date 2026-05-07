import LoginForm from '@/components/auth/LoginForm'
import type { Metadata } from 'next'
import { EMAIL_VERIFICATION_REQUIRED_MESSAGE } from '@/lib/auth/emailVerification'

export const metadata: Metadata = {
  title: 'Đăng nhập',
}

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed: EMAIL_VERIFICATION_REQUIRED_MESSAGE,
  auth_callback_failed: 'Không thể đăng nhập. Vui lòng thử lại.',
  oauth_missing_email: 'Không thể đăng nhập bằng Google vì tài khoản không có email. Vui lòng dùng email và mật khẩu.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const initialError = params?.error ? LOGIN_ERROR_MESSAGES[params.error] : null
  return <LoginForm nextPath={params?.next ?? null} initialError={initialError ?? null} />
}

import LoginForm from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng nhập',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  return <LoginForm nextPath={params?.next ?? null} />
}

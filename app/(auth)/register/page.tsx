import RegisterForm from '@/components/auth/RegisterForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tạo tài khoản',
}

export default function RegisterPage() {
  return <RegisterForm />
}

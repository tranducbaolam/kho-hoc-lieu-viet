'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { AlertCircle, Loader2, Mail, Lock } from 'lucide-react'
import { login } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSafeInternalPath } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/client'
import { GoogleIcon } from './GoogleIcon'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const GOOGLE_LOGIN_ERROR = 'Không thể đăng nhập bằng Google. Vui lòng thử lại.'

export default function LoginForm({
  nextPath,
  initialError,
}: {
  nextPath?: string | null
  initialError?: string | null
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const { register, handleSubmit, clearErrors, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setError(null)
    setLoading(true)
    const formData = new FormData()
    formData.set('email', values.email)
    formData.set('password', values.password)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      router.push(getSafeInternalPath(nextPath) ?? '/dashboard')
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setOauthLoading(true)

    const supabase = createClient()
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (!oauthError) return
    } catch {
      // Fall through to the shared Vietnamese error below.
    }

    setError(GOOGLE_LOGIN_ERROR)
    setOauthLoading(false)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Đăng nhập</h2>
        <p className="text-sm text-gray-500 mt-1">Đăng nhập bằng email và mật khẩu để sử dụng tài khoản.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="ban@example.com"
              className="pl-9 h-10"
              {...register('email', { onChange: () => clearErrors('email') })}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-red-600 animate-in fade-in duration-150">
              <AlertCircle className="size-3 shrink-0" />{errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Mật khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-9 h-10"
              {...register('password', { onChange: () => clearErrors('password') })}
            />
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-xs text-red-600 animate-in fade-in duration-150">
              <AlertCircle className="size-3 shrink-0" />{errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-sm shadow-blue-500/20 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/20 hover:-translate-y-px active:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      <div className="mt-5">
        <Button
          type="button"
          variant="outline"
          disabled={loading || oauthLoading}
          onClick={handleGoogleLogin}
          className="w-full h-10 gap-2"
        >
          {oauthLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang chuyển hướng...
            </>
          ) : (
            <>
              <GoogleIcon className="h-4 w-4" />
              Đăng nhập bằng Google
            </>
          )}
        </Button>
      </div>

      <p className="text-sm text-gray-500 text-center mt-6">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
          Tạo tài khoản
        </Link>
      </p>
    </div>
  )
}

import { requireAuth } from '@/lib/auth/session'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { Toaster } from 'sonner'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAuth()
  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center space-y-3">
          <h1 className="text-lg font-bold">Bạn không có quyền truy cập trang quản trị.</h1>
          <p className="text-sm text-muted-foreground">
            Tài khoản người dùng chỉ dùng để xem nội dung công khai và bình luận (nếu được bật).
          </p>
          <Link href="/" className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-foreground text-background text-sm font-medium">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar profile={profile} />
        <main className="flex-1 overflow-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
      <Toaster richColors />
    </AuthProvider>
  )
}

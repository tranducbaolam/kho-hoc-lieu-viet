import type { Metadata } from 'next'
import { getAllUsers } from '@/features/users/queries'
import { UserTable } from '@/components/dashboard/UserTable'
import { requirePermission } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Người dùng' }

export default async function UsersPage() {
  const profile = await requirePermission('users:read')

  const users = await getAllUsers()

  return (
    <div className="p-4 md:p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Người dùng</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tổng cộng {users.length} người dùng
        </p>
      </div>
      <UserTable users={users} currentUserId={profile.id} />
    </div>
  )
}

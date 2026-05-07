import type { Metadata } from 'next'
import { format } from 'date-fns'
import { requirePermission } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'

export const metadata: Metadata = { title: 'Lượt truy cập' }

type VisitRow = {
  id: string
  path: string
  ip_hash: string | null
  user_agent: string | null
  country: string | null
  city: string | null
  created_at: string | null
  user: { email: string } | null
}

async function getLatestVisits(limit = 100): Promise<VisitRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('visit_logs')
    .select('id, path, ip_hash, user_agent, country, city, created_at, user:profiles(email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as VisitRow[]
}

function ipHashPrefix(hash: string | null) {
  return hash ? `${hash.slice(0, 12)}...` : '-'
}

function locationLabel(country: string | null, city: string | null) {
  return [city, country].filter(Boolean).join(', ') || '-'
}

export default async function VisitsPage() {
  await requirePermission('users:read')
  const visits = await getLatestVisits()

  return (
    <div className="p-4 md:p-8 space-y-6 animate-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lượt truy cập</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {visits.length} lượt truy cập bài viết gần nhất. IP chỉ hiển thị dạng hash rút gọn.
        </p>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        {visits.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có lượt truy cập.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Đường dẫn</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">IP hash</th>
                  <th className="px-4 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{visit.path}</td>
                    <td className="px-4 py-3 text-muted-foreground">{locationLabel(visit.country, visit.city)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{visit.user?.email ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ipHashPrefix(visit.ip_hash)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {visit.created_at ? format(new Date(visit.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

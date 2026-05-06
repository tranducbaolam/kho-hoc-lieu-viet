import { Badge } from '@/components/ui/badge'

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (role === 'admin') {
    return <Badge variant="default">Quản trị viên</Badge>
  }
  return <Badge variant="secondary">Người dùng</Badge>
}

import { Badge } from '@/components/ui/badge'

interface PostStatusBadgeProps {
  status: string
}

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  if (status === 'published') {
    return <Badge variant="default">Đã đăng</Badge>
  }
  return <Badge variant="secondary">Bản nháp</Badge>
}

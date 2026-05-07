'use client'

import { useEffect } from 'react'

export function ArticleVisitLogger({ path }: { path: string }) {
  useEffect(() => {
    void fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => undefined)
  }, [path])

  return null
}

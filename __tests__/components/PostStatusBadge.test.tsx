import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PostStatusBadge } from '@/features/posts/components/PostStatusBadge'

describe('PostStatusBadge', () => {
  it('renders Vietnamese published badge for published status', () => {
    render(<PostStatusBadge status="published" />)
    expect(screen.getByText('Đã đăng')).toBeInTheDocument()
  })

  it('renders Vietnamese draft badge for draft status', () => {
    render(<PostStatusBadge status="draft" />)
    expect(screen.getByText('Bản nháp')).toBeInTheDocument()
  })

  it('renders Vietnamese draft badge for unknown status', () => {
    render(<PostStatusBadge status="archived" />)
    expect(screen.getByText('Bản nháp')).toBeInTheDocument()
  })
})

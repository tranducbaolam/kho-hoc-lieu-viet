import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoleBadge } from '@/components/dashboard/RoleBadge'

describe('RoleBadge', () => {
  it('renders Admin badge for admin role', () => {
    render(<RoleBadge role="admin" />)
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument()
  })

  it('renders User badge for user role', () => {
    render(<RoleBadge role="user" />)
    expect(screen.getByText('Người dùng')).toBeInTheDocument()
  })

  it('renders User badge for unknown role', () => {
    render(<RoleBadge role="unknown" />)
    expect(screen.getByText('Người dùng')).toBeInTheDocument()
  })
})

// __tests__/components/CommentForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommentForm } from '@/features/comments/components/CommentForm'

vi.mock('@/features/comments/actions', () => ({
  createComment: vi.fn().mockResolvedValue({ data: { id: 'new-comment' } }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('CommentForm', () => {
  it('renders textarea and submit button when authenticated', () => {
    render(<CommentForm postId="post-1" postSlug="test-post" authorName="Jane Doe" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /đăng bình luận/i })).toBeInTheDocument()
  })

  it('shows Vietnamese commenting label with author name', () => {
    render(<CommentForm postId="post-1" postSlug="test-post" authorName="Jane Doe" />)
    expect(screen.getByText(/bình luận với tên/i)).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('shows sign-in CTA when not authenticated', () => {
    render(<CommentForm postId="post-1" postSlug="test-post" authorName={null} />)
    expect(screen.getByRole('link', { name: /đăng nhập để bình luận/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows validation error for empty content', async () => {
    render(<CommentForm postId="post-1" postSlug="test-post" authorName="Jane Doe" />)
    fireEvent.click(screen.getByRole('button', { name: /đăng bình luận/i }))
    await waitFor(() => {
      expect(screen.getByText(/bình luận không được để trống/i)).toBeInTheDocument()
    })
  })

  it('calls createComment on valid submit', async () => {
    const { createComment } = await import('@/features/comments/actions')
    render(<CommentForm postId="post-1" postSlug="test-post" authorName="Jane Doe" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nice post!' } })
    fireEvent.click(screen.getByRole('button', { name: /đăng bình luận/i }))
    await waitFor(() => {
      expect(createComment).toHaveBeenCalledWith('post-1', 'Nice post!', 'test-post')
    })
  })
})

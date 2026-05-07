import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PublicAttachmentsSection } from '@/features/attachments/components/PublicAttachmentsSection'

const attachment = {
  id: 'attachment-1',
  file_name: 'de-thi.pdf',
  file_url: '/api/attachments/attachment-1/download',
  description: null,
  file_size: 1024,
  file_type: 'application/pdf',
  download_count: 12,
}

describe('PublicAttachmentsSection', () => {
  it('shows download counts and login CTA for anonymous users', () => {
    render(
      <PublicAttachmentsSection
        attachments={[attachment]}
        isAuthenticated={false}
        currentPath="/hoc/can-bac-hai"
      />
    )

    expect(screen.getByText('Đã tải: 12 lượt')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Đăng nhập để tải' })
    expect(link).toHaveAttribute('href', '/login?next=%2Fhoc%2Fcan-bac-hai')
  })

  it('shows download CTA for authenticated users', () => {
    render(
      <PublicAttachmentsSection
        attachments={[attachment]}
        isAuthenticated
        currentPath="/hoc/can-bac-hai"
      />
    )

    const link = screen.getByRole('link', { name: 'Tải xuống' })
    expect(link).toHaveAttribute('href', '/api/attachments/attachment-1/download')
  })
})

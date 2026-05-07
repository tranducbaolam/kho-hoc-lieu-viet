import type { Metadata } from 'next'

const contactEmail = 'baolam...@gmail.com'

export const metadata: Metadata = {
  title: 'Chính sách quyền riêng tư',
  description: 'Chính sách quyền riêng tư của Kho Học Liệu Việt.',
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 md:py-14">
      <article className="prose prose-slate max-w-none">
        <p className="text-sm font-medium text-primary uppercase tracking-widest">Kho Học Liệu Việt</p>
        <h1>Chính sách quyền riêng tư</h1>

        <p>
          Kho Học Liệu Việt có thể thu thập một số thông tin tài khoản cơ bản như email,
          tên hiển thị, thông tin nhà cung cấp đăng nhập và hoạt động liên quan đến bình luận
          hoặc lượt tải tài liệu nếu tính năng đó được sử dụng.
        </p>

        <p>
          Các thông tin này chỉ được dùng cho mục đích đăng nhập tài khoản, kiểm soát quyền
          truy cập, quản lý bình luận, cấp quyền tải tài liệu, bảo mật hệ thống và cải thiện
          nội dung giáo dục trên website.
        </p>

        <p>
          Kho Học Liệu Việt không bán dữ liệu cá nhân của người dùng cho bên thứ ba.
        </p>

        <p>
          Các tài liệu học tập có thể tải về trên website được cung cấp cho mục đích học tập,
          tham khảo và ôn luyện.
        </p>

        <p>
          Người dùng có thể liên hệ chủ sở hữu website để yêu cầu xóa tài khoản hoặc dữ liệu
          cá nhân liên quan.
        </p>

        <p>
          Email liên hệ:{' '}
          <strong>{contactEmail}</strong>{' '}
          <span className="text-muted-foreground">
            (email placeholder, cần thay bằng email liên hệ thật trước khi công bố chính thức).
          </span>
        </p>
      </article>
    </div>
  )
}

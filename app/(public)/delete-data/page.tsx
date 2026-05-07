import type { Metadata } from 'next'

const contactEmail = 'baolam...@gmail.com'

export const metadata: Metadata = {
  title: 'Hướng dẫn xóa dữ liệu người dùng',
  description: 'Hướng dẫn yêu cầu xóa dữ liệu tài khoản Kho Học Liệu Việt.',
}

export default function DeleteDataPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 md:py-14">
      <article className="prose prose-slate max-w-none">
        <p className="text-sm font-medium text-primary uppercase tracking-widest">Kho Học Liệu Việt</p>
        <h1>Hướng dẫn xóa dữ liệu người dùng</h1>

        <p>
          Người dùng có thể yêu cầu xóa tài khoản và dữ liệu hồ sơ liên quan đến tài khoản
          Kho Học Liệu Việt.
        </p>

        <p>Để gửi yêu cầu xóa dữ liệu, vui lòng thực hiện các bước sau:</p>

        <ol>
          <li>Gửi email đến chủ sở hữu website.</li>
          <li>Ghi rõ email đã dùng để đăng nhập tài khoản.</li>
          <li>
            Nêu yêu cầu:{' '}
            <strong>“Tôi muốn xóa dữ liệu tài khoản Kho Học Liệu Việt.”</strong>
          </li>
        </ol>

        <p>
          Email liên hệ:{' '}
          <strong>{contactEmail}</strong>{' '}
          <span className="text-muted-foreground">
            (email placeholder, cần thay bằng email liên hệ thật trước khi công bố chính thức).
          </span>
        </p>

        <p>
          Các yêu cầu xóa dữ liệu sẽ được xem xét và xử lý thủ công. Trong một số trường hợp,
          chủ sở hữu website có thể cần xác minh thông tin tài khoản trước khi thực hiện yêu cầu.
        </p>
      </article>
    </div>
  )
}

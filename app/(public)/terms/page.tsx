import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản sử dụng website Kho Học Liệu Việt.',
}

export default function TermsPage() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 md:py-14">
      <article className="prose prose-slate max-w-none">
        <p className="text-sm font-medium text-primary uppercase tracking-widest">Kho Học Liệu Việt</p>
        <h1>Điều khoản sử dụng</h1>

        <p>
          Kho Học Liệu Việt cung cấp tài liệu giáo dục, bài học, bài tập, lời giải và tài liệu
          có thể tải về nhằm hỗ trợ học tập, tham khảo và ôn luyện.
        </p>

        <p>
          Người dùng phải sử dụng nội dung trên website cho các mục đích học tập, tham khảo
          hợp pháp và phù hợp với quy định hiện hành.
        </p>

        <p>
          Người dùng không được lạm dụng hệ thống, tấn công website, tải lên nội dung độc hại,
          khai thác lỗ hổng bảo mật hoặc sử dụng tài khoản sai mục đích.
        </p>

        <p>
          Quản trị viên có thể cập nhật, chỉnh sửa, gỡ bỏ nội dung hoặc hạn chế quyền truy cập
          khi cần thiết để bảo vệ hệ thống, người dùng và chất lượng nội dung.
        </p>

        <p>
          Nội dung trên website có thể còn sai sót. Người dùng nên kiểm tra lại các thông tin
          quan trọng, đặc biệt khi sử dụng cho học tập, thi cử hoặc trích dẫn chính thức.
        </p>

        <p>
          Điều khoản sử dụng có thể được cập nhật khi website thay đổi tính năng, nội dung hoặc
          cách vận hành.
        </p>
      </article>
    </div>
  )
}

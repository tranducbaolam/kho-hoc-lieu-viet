import Link from 'next/link'
import Image from 'next/image'
import { NavAuthButton } from '@/components/NavAuthButton'
import { HeaderSearch } from '@/components/HeaderSearch'

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/lop/lop-6/toan', label: 'Toán lớp 6' },
  { href: '/lop/lop-7/toan', label: 'Toán lớp 7' },
  { href: '/lop/lop-8/toan', label: 'Toán lớp 8' },
  { href: '/lop/lop-9/toan', label: 'Toán lớp 9' },
  { href: '/tim-kiem?subject=tieng-anh', label: 'Tiếng Anh' },
  { href: '/tim-kiem?subject=tin-hoc', label: 'Tin học' },
  { href: '/de-thi', label: 'Đề thi' },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto py-3 px-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Kho Học Liệu Việt" width={32} height={32} className="rounded-sm" priority />
            <span
              className="font-bold text-base sm:text-lg tracking-tight whitespace-nowrap"
              style={{ fontFamily: 'var(--font-playfair, serif)' }}
            >
              Kho Học Liệu Việt
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="px-2.5 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="flex items-center gap-3">
            <HeaderSearch />
            <NavAuthButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground/60 tracking-wide">
        <p>&copy; {new Date().getFullYear()} Kho Học Liệu Việt. Nội dung học tập nguyên bản.</p>
      </footer>
    </div>
  )
}

import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-md px-4 py-12 animate-page">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4">
            <Image src="/logo.png" alt="Kho Học Liệu Việt" width={56} height={56} className="rounded-2xl" priority />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kho Học Liệu Việt</h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý bài học, lời giải và đề thi</p>
        </div>

        {/* Subtle glow behind card */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

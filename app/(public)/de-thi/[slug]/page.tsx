import { redirect } from 'next/navigation'

interface ExamDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { slug } = await params
  redirect(`/hoc/${slug}`)
}

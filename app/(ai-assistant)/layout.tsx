import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { AIAssistantShell } from '@/components/ai-assistant/AIAssistantShell'
import { Toaster } from 'sonner'
import { isEmailVerified } from '@/lib/auth/emailVerification'

export default async function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isEmailVerified(user)) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <AuthProvider>
      <AIAssistantShell>
        {children}
      </AIAssistantShell>
      <Toaster richColors />
    </AuthProvider>
  )
}

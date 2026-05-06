import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isEmailVerified } from '@/lib/auth/emailVerification'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (isEmailVerified(user)) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=email_not_confirmed`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

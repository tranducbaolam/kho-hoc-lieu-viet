import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isEmailVerified } from '@/lib/auth/emailVerification'
import { getSafeInternalPath } from '@/lib/auth/redirect'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeInternalPath(searchParams.get('next')) ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=oauth_missing_email`)
      }
      if (isEmailVerified(user)) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=email_not_confirmed`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

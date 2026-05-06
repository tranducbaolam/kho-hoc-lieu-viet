'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function register(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
    },
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

  const { data: authData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      ...data.options,
      emailRedirectTo: new URL('/auth/callback', baseUrl).toString(),
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (authData.session) {
    await supabase.auth.signOut()
  }

  revalidatePath('/', 'layout')
  return { needsConfirmation: true }
}

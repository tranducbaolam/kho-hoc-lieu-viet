'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  EMAIL_VERIFICATION_REQUIRED_MESSAGE,
  isEmailNotConfirmedError,
  isEmailVerified,
} from '@/lib/auth/emailVerification'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    if (isEmailNotConfirmedError(error.message)) {
      return { error: EMAIL_VERIFICATION_REQUIRED_MESSAGE }
    }
    return { error: error.message }
  }

  if (!isEmailVerified(authData.user)) {
    await supabase.auth.signOut()
    return { error: EMAIL_VERIFICATION_REQUIRED_MESSAGE }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

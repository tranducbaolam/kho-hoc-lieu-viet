type EmailVerificationUser = {
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}

export const EMAIL_VERIFICATION_REQUIRED_MESSAGE =
  'Tài khoản chưa xác minh email. Vui lòng kiểm tra hộp thư.'

export const CHECK_EMAIL_VERIFICATION_MESSAGE =
  'Vui lòng kiểm tra email để xác minh tài khoản.'

export function isEmailVerified(user: EmailVerificationUser | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at)
}

export function isEmailNotConfirmedError(message: string | null | undefined): boolean {
  return Boolean(message && /email.*not.*confirm|not.*confirm|confirm.*email/i.test(message))
}

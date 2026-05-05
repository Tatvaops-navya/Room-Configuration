'use client'

const TOKEN_KEY = 'spacia.token'
const OTP_KEY = 'spacia.otpVerified'
const PHONE_KEY = 'spacia.phone'

export function getSpaciaToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const t = window.localStorage.getItem(TOKEN_KEY)?.trim()
    return t || null
  } catch {
    return null
  }
}

export function isOtpVerifiedFlag(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(OTP_KEY) === '1'
  } catch {
    return false
  }
}

/** True when user has completed phone OTP flow (token or legacy otp flag). */
export function isSpaciaSignedIn(): boolean {
  return Boolean(getSpaciaToken()) || isOtpVerifiedFlag()
}

export function setSpaciaPhone(phone: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PHONE_KEY, phone.trim())
  } catch {
    /* ignore */
  }
}

export function getSpaciaPhone(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const p = window.localStorage.getItem(PHONE_KEY)?.trim()
    return p || null
  } catch {
    return null
  }
}

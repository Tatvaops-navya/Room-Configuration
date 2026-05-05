'use client'

import type { OnboardingAnswers, UserProfile } from '@/app/lib/userProfile/types'
import { EMPTY_ONBOARDING_ANSWERS } from '@/app/lib/userProfile/types'
import { getSpaciaPhone, getSpaciaToken } from '@/app/lib/auth/spaciaSession'

/** Stable bucket per JWT so we do not share `default` across different signed-in users. */
function tokenStorageSuffix(): string | null {
  const t = getSpaciaToken()
  if (!t || t.length < 8) return null
  let h = 2166136261
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `tk_${(h >>> 0).toString(36)}`
}

function storageKey(): string {
  const phone = getSpaciaPhone()
  if (phone) {
    const digits = phone.replace(/\D/g, '').slice(-10)
    if (digits.length === 10) return `spacia.userProfile.${digits}`
  }
  const tk = tokenStorageSuffix()
  if (tk) return `spacia.userProfile.${tk}`
  return 'spacia.userProfile.default'
}

const defaultProfile: UserProfile = {
  onboardingCompleted: false,
  onboardingAnswers: null,
}

export function readUserProfileFromStorage(): UserProfile {
  if (typeof window === 'undefined') return { ...defaultProfile }
  try {
    const raw = window.localStorage.getItem(storageKey())
    if (!raw) return { ...defaultProfile }
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    return {
      onboardingCompleted: Boolean(parsed.onboardingCompleted),
      onboardingAnswers:
        parsed.onboardingAnswers &&
        typeof parsed.onboardingAnswers === 'object' &&
        typeof (parsed.onboardingAnswers as OnboardingAnswers).reasonForUsingApp === 'string'
          ? {
              reasonForUsingApp: String((parsed.onboardingAnswers as OnboardingAnswers).reasonForUsingApp),
              userType: String((parsed.onboardingAnswers as OnboardingAnswers).userType),
              designExperience: String((parsed.onboardingAnswers as OnboardingAnswers).designExperience),
              planningStage: String((parsed.onboardingAnswers as OnboardingAnswers).planningStage),
            }
          : null,
    }
  } catch {
    return { ...defaultProfile }
  }
}

export function writeUserProfileToStorage(profile: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(profile))
  } catch {
    /* ignore quota */
  }
}

export function mergeRemoteProfile(local: UserProfile, remote: Partial<UserProfile> | null): UserProfile {
  if (!remote) return local
  const completed =
    typeof remote.onboardingCompleted === 'boolean' ? remote.onboardingCompleted : local.onboardingCompleted
  let answers = local.onboardingAnswers
  if ('onboardingAnswers' in remote) {
    const remoteAns = remote.onboardingAnswers
    if (remoteAns === null) answers = null
    else if (
      remoteAns &&
      typeof remoteAns === 'object' &&
      typeof remoteAns.reasonForUsingApp === 'string'
    ) {
      answers = { ...EMPTY_ONBOARDING_ANSWERS, ...remoteAns }
    }
  }
  return {
    onboardingCompleted: completed,
    onboardingAnswers: answers,
  }
}

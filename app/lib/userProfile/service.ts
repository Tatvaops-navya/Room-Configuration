'use client'

import { getSpaciaToken } from '@/app/lib/auth/spaciaSession'
import type { OnboardingAnswers, UserProfile } from '@/app/lib/userProfile/types'
import {
  mergeRemoteProfile,
  readUserProfileFromStorage,
  writeUserProfileToStorage,
} from '@/app/lib/userProfile/storage'

type ProfileApiBody = {
  onboardingCompleted?: unknown
  onboardingAnswers?: unknown
}

function parseCompleted(v: unknown): boolean | undefined {
  if (v === true || v === false) return v
  if (v === 'true') return true
  if (v === 'false' || v === '0') return false
  return undefined
}

function parseAnswers(v: unknown): OnboardingAnswers | null | undefined {
  if (v == null) return v as null
  if (typeof v !== 'object' || !('reasonForUsingApp' in (v as object))) return undefined
  const o = v as Record<string, unknown>
  if (typeof o.reasonForUsingApp !== 'string') return undefined
  return {
    reasonForUsingApp: String(o.reasonForUsingApp),
    userType: String(o.userType ?? ''),
    designExperience: String(o.designExperience ?? ''),
    planningStage: String(o.planningStage ?? ''),
  }
}

/**
 * Loads profile: localStorage first, then optional GET /api/user/profile when a bearer token exists.
 * When the API is not configured (503) or fails, the local profile is returned unchanged.
 */
export async function loadUserProfile(): Promise<UserProfile> {
  const local = readUserProfileFromStorage()
  const token = getSpaciaToken()
  if (!token) return local

  try {
    const res = await fetch('/api/user/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.status === 503 || res.status === 404) return local
    if (!res.ok) return local
    const data = (await res.json().catch(() => null)) as ProfileApiBody | null
    if (!data || typeof data !== 'object') return local

    const remote: Partial<UserProfile> = {}
    if ('onboardingCompleted' in data) {
      const c = parseCompleted(data.onboardingCompleted)
      if (typeof c === 'boolean') remote.onboardingCompleted = c
    }
    if ('onboardingAnswers' in data) {
      const ans = parseAnswers(data.onboardingAnswers)
      if (ans !== undefined) remote.onboardingAnswers = ans
    }

    if (Object.keys(remote).length === 0) return local

    const merged = mergeRemoteProfile(local, remote)
    writeUserProfileToStorage(merged)
    return merged
  } catch {
    return local
  }
}

/**
 * Persists onboarding completion + answers: PATCH /api/user/profile when a token exists (503 = stub, persist locally),
 * otherwise localStorage only. On real upstream errors (non-503), local is not written so the user can retry.
 */
export async function saveOnboardingToProfile(answers: OnboardingAnswers): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile: UserProfile = {
    onboardingCompleted: true,
    onboardingAnswers: { ...answers },
  }

  const token = getSpaciaToken()
  if (!token) {
    writeUserProfileToStorage(profile)
    return { ok: true }
  }

  try {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        onboardingCompleted: true,
        onboardingAnswers: answers,
      }),
    })
    if (res.status === 503) {
      writeUserProfileToStorage(profile)
      return { ok: true }
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
      const msg = err.error || err.message || `Save failed (${res.status})`
      return { ok: false, error: msg }
    }
    writeUserProfileToStorage(profile)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

import { NextRequest, NextResponse } from 'next/server'

/**
 * User profile / onboarding — integration points for your backend.
 *
 * Configure optional env vars to proxy to your API (same contract as this route):
 * - USER_PROFILE_GET_URL   — full URL for GET current user profile (must accept Authorization: Bearer <token>)
 * - USER_PROFILE_PATCH_URL — full URL for PATCH update profile (same auth header, JSON body)
 *
 * Expected upstream JSON shape (subset):
 * { onboardingCompleted: boolean, onboardingAnswers: { reasonForUsingApp, userType, designExperience, planningStage } | null }
 *
 * When URLs are unset, GET returns 503 (client uses localStorage) and PATCH returns 503 after a no-op
 * (client already wrote to localStorage in saveOnboardingToProfile).
 */

async function forwardGet(auth: string | null) {
  const url = process.env.USER_PROFILE_GET_URL?.trim()
  if (!url || !auth) return null
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: auth, Accept: 'application/json' },
    cache: 'no-store',
  })
  const body = await res.json().catch(() => ({}))
  return NextResponse.json(body, { status: res.status })
}

async function forwardPatch(auth: string | null, body: unknown) {
  const url = process.env.USER_PROFILE_PATCH_URL?.trim()
  if (!url || !auth) return null
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const out = await res.json().catch(() => ({}))
  return NextResponse.json(out, { status: res.status })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const forwarded = await forwardGet(auth)
  if (forwarded) return forwarded

  return NextResponse.json(
    {
      ok: false,
      code: 'PROFILE_API_NOT_CONFIGURED',
      message:
        'Set USER_PROFILE_GET_URL to proxy GET profile. Client falls back to localStorage until then.',
    },
    { status: 503 },
  )
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const body = await req.json().catch(() => ({}))
  const forwarded = await forwardPatch(auth, body)
  if (forwarded) return forwarded

  return NextResponse.json(
    {
      ok: true,
      code: 'PROFILE_API_NOT_CONFIGURED',
      persistedLocallyOnly: true,
      message:
        'Set USER_PROFILE_PATCH_URL to sync onboarding to your backend. Answers were saved in the browser.',
    },
    { status: 503 },
  )
}

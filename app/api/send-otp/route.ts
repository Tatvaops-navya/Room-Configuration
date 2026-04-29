import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    phone?: unknown
    phoneNumber?: unknown
  }

  const phoneNumberRaw =
    typeof body.phoneNumber === 'string'
      ? body.phoneNumber.trim()
      : typeof body.phone === 'string'
        ? body.phone.trim()
        : ''

  // TatvaOps API (per your Postman collection) expects 10-digit phoneNumber without +91.
  const phoneNumber = phoneNumberRaw.replace(/\D/g, '').slice(-10)
  if (phoneNumber.length !== 10) {
    return NextResponse.json(
      { ok: false, error: 'Phone number must be exactly 10 digits.' },
      { status: 400 },
    )
  }

  const upstream = 'https://devapi.tatvaops.com/users/api/auth/send-otp'

  try {
    const res = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({} as unknown))
    if (!res.ok) {
      const msg =
        (data as any)?.message ||
        (data as any)?.error ||
        `Upstream error (${res.status})`
      return NextResponse.json({ ok: false, error: msg, data }, { status: res.status })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to reach OTP service.' },
      { status: 502 },
    )
  }
}


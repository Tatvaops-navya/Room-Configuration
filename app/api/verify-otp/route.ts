import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    phone?: unknown
    phoneNumber?: unknown
    otp?: unknown
  }

  const phoneNumberRaw =
    typeof body.phoneNumber === 'string'
      ? body.phoneNumber.trim()
      : typeof body.phone === 'string'
        ? body.phone.trim()
        : ''
  const phoneNumber = phoneNumberRaw.replace(/\D/g, '').slice(-10)

  const otp = typeof body.otp === 'string' ? body.otp.trim() : ''

  if (phoneNumber.length !== 10) {
    return NextResponse.json(
      { ok: false, error: 'Phone number must be exactly 10 digits.' },
      { status: 400 },
    )
  }
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json({ ok: false, error: 'Invalid OTP format.' }, { status: 400 })
  }

  const upstream = 'https://devapi.tatvaops.com/users/api/auth/verify-otp'

  try {
    const res = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp }),
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

    // Pass through whatever the upstream returns (token, user, etc.)
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to reach OTP service.' },
      { status: 502 },
    )
  }
}


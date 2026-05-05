import { NextRequest, NextResponse } from 'next/server'
import { applyUpdatePayment, getBillingSnapshot } from '../billingDemoStore'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      brand?: unknown
      last4?: unknown
      expiry?: unknown
    }
    const brand = body.brand === 'Visa' || body.brand === 'Mastercard' ? body.brand : null
    const last4 = typeof body.last4 === 'string' ? body.last4.replace(/\D/g, '').slice(-4) : ''
    const expiry = typeof body.expiry === 'string' ? body.expiry.trim() : ''

    if (!brand || last4.length !== 4 || !/^\d{2}\/\d{2}$/.test(expiry)) {
      return NextResponse.json({ ok: false, error: 'Invalid payment method.' }, { status: 400 })
    }

    applyUpdatePayment({ brand, last4, expiry })
    return NextResponse.json({ ok: true, data: getBillingSnapshot() })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Update payment failed.' },
      { status: 500 },
    )
  }
}

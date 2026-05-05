import { NextResponse } from 'next/server'
import { getBillingSnapshot } from './billingDemoStore'

export async function GET() {
  try {
    const full = getBillingSnapshot()
    const { invoices: _i, ...rest } = full
    return NextResponse.json({ ok: true, data: rest })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load billing.' },
      { status: 500 },
    )
  }
}

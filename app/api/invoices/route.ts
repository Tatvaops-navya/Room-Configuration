import { NextResponse } from 'next/server'
import { getBillingSnapshot } from '../billing/billingDemoStore'

export async function GET() {
  try {
    const { invoices } = getBillingSnapshot()
    return NextResponse.json({ ok: true, data: { invoices } })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load invoices.' },
      { status: 500 },
    )
  }
}

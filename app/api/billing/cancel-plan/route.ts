import { NextResponse } from 'next/server'
import { applyCancelPlan, getBillingSnapshot } from '../billingDemoStore'

export async function POST() {
  try {
    applyCancelPlan()
    return NextResponse.json({ ok: true, data: getBillingSnapshot() })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Cancel plan failed.' },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { applyChangePlan, getBillingSnapshot } from '../billingDemoStore'
import type { BillingCycle } from '../billingDemoStore'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      planName?: unknown
      planPrice?: unknown
      billingCycle?: unknown
    }
    const planName = typeof body.planName === 'string' ? body.planName.trim() : ''
    const planPrice = typeof body.planPrice === 'number' ? body.planPrice : Number(body.planPrice)
    const cycle = body.billingCycle === 'yearly' || body.billingCycle === 'monthly' ? body.billingCycle : null

    if (!planName || !Number.isFinite(planPrice) || planPrice < 0 || !cycle) {
      return NextResponse.json({ ok: false, error: 'Invalid plan payload.' }, { status: 400 })
    }

    applyChangePlan({
      planName,
      planPrice,
      billingCycle: cycle as BillingCycle,
    })

    return NextResponse.json({ ok: true, data: getBillingSnapshot() })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Change plan failed.' },
      { status: 500 },
    )
  }
}

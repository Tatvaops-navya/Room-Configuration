import { buildApiUrl } from '../apiUrl'
import type { BillingCycle, CardBrand, UserBilling, BillingSummary } from './types'

type ApiOk<T> = { ok: true; data: T }
type ApiErr = { ok: false; error?: string }

async function parseJson<T>(res: Response): Promise<T> {
  const raw = await res.text()
  let body: unknown = {}
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('Invalid JSON from server.')
  }
  const j = body as ApiOk<T> | ApiErr
  if (!res.ok) {
    const msg = (j as ApiErr)?.error || res.statusText || `Request failed (${res.status})`
    throw new Error(msg)
  }
  if (!j || typeof j !== 'object' || (j as ApiOk<T>).ok !== true) {
    const msg = (j as ApiErr)?.error || 'Request failed'
    throw new Error(msg)
  }
  return (j as ApiOk<T>).data
}

export async function fetchBillingSummary(): Promise<BillingSummary> {
  const res = await fetch(buildApiUrl('/api/billing'), { method: 'GET', cache: 'no-store' })
  return parseJson<BillingSummary>(res)
}

export async function fetchInvoicesList(): Promise<{ invoices: UserBilling['invoices'] }> {
  const res = await fetch(buildApiUrl('/api/invoices'), { method: 'GET', cache: 'no-store' })
  return parseJson<{ invoices: UserBilling['invoices'] }>(res)
}

export async function postChangePlan(input: {
  planName: string
  planPrice: number
  billingCycle: BillingCycle
}): Promise<UserBilling> {
  const res = await fetch(buildApiUrl('/api/billing/change-plan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJson<UserBilling>(res)
}

export async function postCancelPlan(): Promise<UserBilling> {
  const res = await fetch(buildApiUrl('/api/billing/cancel-plan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  return parseJson<UserBilling>(res)
}

export async function postUpdatePayment(input: {
  brand: CardBrand
  last4: string
  expiry: string
}): Promise<UserBilling> {
  const res = await fetch(buildApiUrl('/api/billing/update-payment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJson<UserBilling>(res)
}

/**
 * In-memory billing snapshot for demo / local dev.
 * Shared across GET/POST billing routes until a real DB is wired.
 */

export type BillingCycle = 'monthly' | 'yearly'
export type BillingStatus = 'active' | 'cancelled' | 'past_due'
export type CardBrand = 'Visa' | 'Mastercard'
export type InvoiceStatus = 'paid' | 'failed' | 'pending'

export type BillingInvoice = {
  id: string
  date: string
  amount: number
  status: InvoiceStatus
  pdfUrl: string
  /** Optional detail fields for invoice sheet */
  planName?: string
  billingPeriodLabel?: string
}

export type UserBilling = {
  planName: string
  planPrice: number
  billingCycle: BillingCycle
  status: BillingStatus
  nextBillingDate: string
  paymentMethod: {
    brand: CardBrand
    last4: string
    expiry: string
  }
  usage: {
    roomsUsed: number
    roomsLimit: number
    generationsUsed: number
    generationsLimit: number
  }
  invoices: BillingInvoice[]
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function defaultInvoices(now: Date): BillingInvoice[] {
  const y = now.getFullYear()
  return [
    {
      id: 'INV-2024-008',
      date: `${y}-07-11`,
      amount: 599,
      status: 'paid',
      pdfUrl: '',
      planName: 'Pro Architect Plan',
      billingPeriodLabel: 'July 1 – July 31, 2026',
    },
    {
      id: 'INV-2024-007',
      date: new Date(y, 5, 12).toISOString().slice(0, 10),
      amount: 599,
      status: 'paid',
      pdfUrl: '',
      planName: 'Pro Architect Plan',
      billingPeriodLabel: 'June 1 – June 30, 2026',
    },
  ]
}

function createDefault(): UserBilling {
  const now = new Date()
  const next = addMonths(now.toISOString().slice(0, 10), 1)
  return {
    planName: 'Pro Architect Plan',
    planPrice: 599,
    billingCycle: 'monthly',
    status: 'active',
    nextBillingDate: next,
    paymentMethod: {
      brand: 'Visa',
      last4: '4821',
      expiry: '08/27',
    },
    usage: {
      roomsUsed: 3,
      roomsLimit: 5,
      generationsUsed: 18,
      generationsLimit: 25,
    },
    invoices: defaultInvoices(now),
  }
}

let snapshot: UserBilling = createDefault()

export function getBillingSnapshot(): UserBilling {
  return structuredClone(snapshot)
}

export function replaceBilling(next: UserBilling) {
  snapshot = structuredClone(next)
}

export function applyChangePlan(input: {
  planName: string
  planPrice: number
  billingCycle: BillingCycle
}) {
  snapshot.planName = input.planName
  snapshot.planPrice = input.planPrice
  snapshot.billingCycle = input.billingCycle
  snapshot.status = 'active'
  const base = new Date()
  snapshot.nextBillingDate =
    input.billingCycle === 'yearly'
      ? addMonths(base.toISOString().slice(0, 10), 12)
      : addMonths(base.toISOString().slice(0, 10), 1)
}

export function applyCancelPlan() {
  snapshot.status = 'cancelled'
}

export function applyUpdatePayment(input: { brand: CardBrand; last4: string; expiry: string }) {
  snapshot.paymentMethod = { ...input }
}

export function resetBillingDemo() {
  snapshot = createDefault()
}

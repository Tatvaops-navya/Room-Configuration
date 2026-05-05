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

export type BillingSummary = Omit<UserBilling, 'invoices'>

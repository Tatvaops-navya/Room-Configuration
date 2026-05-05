import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  Loader2,
  Menu,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useBilling } from '@/lib/billing/useBilling'
import type { BillingInvoice, BillingStatus, InvoiceStatus } from '@/lib/billing/types'
import { BillingInvoiceSheet } from './billing/BillingInvoiceSheet'
import { BillingPaymentModal } from './billing/BillingPaymentModal'
import { BillingPricingPanel, type PlanOption } from './billing/BillingPricingPanel'
import { downloadTatvaOpsInvoicePdf } from '@/lib/billing/generateInvoicePdf'

const BILLING_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAXYOoQo8TWVwsS4Ksu8ktX_HaN7HxiX-wbpSQcTehmK6dNJ2gTDqxhuo6149aW49vZgj1j0hIeKBwV0luccj_NNkyQ6EiDekCKhmqv8gYDJ2SKtAh3z_txxYl8IEzmRt7ZHQi_yyOnYt9nTZ4QVu-CC2nizX8sdNNjBrnYuFEMzIgs7dhPB2S-7mB016DpYgFOUc5qc1xoBpAsfoVgEXRcOUCyr8p4AAw_1-W1HBSHBnRmvqdIyIaFgy_ZEHif8gte3gcAkiBZOj4l'

const AVATAR_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAGeSxjNgnAM0mupselUqS5zAQwPcc05PItSU74_wZaYyjlAtBq6CmO0ukwWedTdGOr84xSq5Lw9mbQtskBuQQbxj_Bnu0Tlhr3v_jl0LvtIwwQfYDa7kQ4OXw8DoOyRlKQW3Dg224hhCBhZNOuSMbyi-8aU2ZJWtDSaXNB4Qj1jiwAHMc6Lk9_mwNL6DY4VhZia35ePn3NB2U_2MRkhtfLMDgJMDS95CIjcIom-RnQPtg9P6iyVQdMdAdAVQL228xr6a8_9bedy1MA'

export interface BillingScreenProps {
  onBack: () => void
  onToggleMenu: () => void
  menuOpen: boolean
  onContactSupport: () => void
}

function glassCardClass(extra = '') {
  return `rounded-[24px] border border-white/[0.12] bg-white/[0.06] p-6 shadow-xl backdrop-blur-[20px] ${extra}`
}

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDisplayDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function planStatusStyle(status: BillingStatus): { label: string; className: string } {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        className: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'border-white/15 bg-white/10 text-white/55',
      }
    case 'past_due':
      return {
        label: 'Past due',
        className: 'border-red-500/35 bg-red-500/15 text-red-300',
      }
    default:
      return { label: status, className: 'border-white/15 bg-white/10 text-white/55' }
  }
}

function invoiceStatusStyle(status: InvoiceStatus): string {
  switch (status) {
    case 'paid':
      return 'border-green-500/30 bg-green-500/20 text-green-400'
    case 'failed':
      return 'border-red-500/35 bg-red-500/15 text-red-300'
    case 'pending':
      return 'border-amber-500/35 bg-amber-500/15 text-amber-200'
    default:
      return 'border-white/20 bg-white/10 text-white/60'
  }
}

function usageBar(used: number, limit: number) {
  if (!limit || limit <= 0) return { pct: 0, exceeded: used > 0 }
  const raw = (used / limit) * 100
  const pct = Math.min(100, Math.round(raw * 10) / 10)
  return { pct, exceeded: used > limit }
}

function BillingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 px-1 pt-2">
      <div className="mx-auto h-9 w-36 rounded-lg bg-white/10" />
      <div className="h-40 rounded-[24px] bg-white/10" />
      <div className="h-32 rounded-[24px] bg-white/10" />
      <div className="h-36 rounded-[24px] bg-white/10" />
    </div>
  )
}

export function BillingScreen({ onBack, onToggleMenu, menuOpen, onContactSupport }: BillingScreenProps) {
  const { data, loading, error, staleFromCache, pending, reload, changePlan, cancelPlan, updatePayment } = useBilling()
  const [showPricing, setShowPricing] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [detailInvoice, setDetailInvoice] = useState<BillingInvoice | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const busy = pending !== null

  const roomsBar = useMemo(
    () => (data ? usageBar(data.usage.roomsUsed, data.usage.roomsLimit) : { pct: 0, exceeded: false }),
    [data]
  )
  const genBar = useMemo(
    () => (data ? usageBar(data.usage.generationsUsed, data.usage.generationsLimit) : { pct: 0, exceeded: false }),
    [data]
  )

  const statusUi = data ? planStatusStyle(data.status) : null

  const openInvoiceDetails = (inv: BillingInvoice) => {
    setDetailInvoice(inv)
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setTimeout(() => setDetailInvoice(null), 200)
  }

  const handlePdf = async (inv: BillingInvoice) => {
    if (!data) {
      toast.error('Billing data is not ready yet.')
      return
    }
    try {
      await downloadTatvaOpsInvoicePdf({
        invoice: inv,
        planName: inv.planName ?? data.planName,
        billingCycle: data.billingCycle,
        paymentBrand: data.paymentMethod.brand,
        paymentLast4: data.paymentMethod.last4,
        usage: data.usage,
      })
      toast.success('Download started', {
        description: `Saved as invoice_${inv.id.replace(/^#/, '').replace(/\s+/g, '_')}.pdf`,
      })
    } catch {
      toast.error('Could not generate PDF.')
    }
  }

  const onPickPlan = async (p: PlanOption) => {
    await changePlan({
      planName: p.planName,
      planPrice: p.planPrice,
      billingCycle: p.billingCycle,
    })
    setShowPricing(false)
  }

  const confirmCancel = async () => {
    try {
      await cancelPlan()
      setShowCancelConfirm(false)
    } catch {
      // toast in hook
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0f0d0b] text-[#e6e0e9]">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BILLING_BG})` }}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#0f0d0b]/90 backdrop-blur-sm" />

      <header className="relative z-50 flex w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#0f0d0b]/75 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)] shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-[20px]">
        <button
          type="button"
          onClick={onBack}
          disabled={busy && pending !== 'load'}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5 active:opacity-70 disabled:opacity-40"
          aria-label="Back"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="text-lg font-light tracking-wide text-white">Billing &amp; Invoices</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMenu}
            disabled={busy && pending !== 'load'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/16 bg-white/[0.08] text-white transition-opacity active:opacity-70 disabled:opacity-40"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 active:opacity-70">
            <img alt="" src={AVATAR_SRC} className="h-full w-full object-cover" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pb-[max(calc(5.5rem+env(safe-area-inset-bottom)),7.5rem)] pt-4 [-webkit-overflow-scrolling:touch]">
        {loading && !data ? (
          <BillingSkeleton />
        ) : error && !data ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <AlertTriangle className="text-amber-400" size={40} />
            <p className="text-sm text-white/70">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <div className="mx-auto max-w-lg space-y-6 pb-4">
            {staleFromCache ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium text-amber-100/90">
                Showing saved data — tap Retry when you are back online.
              </div>
            ) : null}

            <section className="flex flex-col items-center justify-center py-4 text-center">
              <div className="mb-2 w-[120px] opacity-90">
                <span className="text-2xl font-extrabold tracking-tighter text-white">TatvaOps</span>
              </div>
              <p className="text-sm text-white/60">Manage your billing and subscriptions</p>
            </section>

            <section className={glassCardClass()}>
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">{data.planName}</h3>
                  <div className="mt-1 flex flex-wrap items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{formatInr(data.planPrice)}</span>
                    <span className="text-sm text-white/55">
                      / {data.billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                </div>
                {statusUi ? (
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusUi.className}`}
                  >
                    {statusUi.label}
                  </span>
                ) : null}
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-white/55">
                  <Calendar size={18} className="shrink-0 text-white/70" />
                  <span>Next billing: {formatDisplayDate(data.nextBillingDate)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/55">
                  <CreditCard size={18} className="shrink-0 text-white/70" />
                  <span>
                    {data.paymentMethod.brand} •••• {data.paymentMethod.last4}
                  </span>
                </div>
              </div>
              <hr className="my-5 border-white/10" />
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={busy || data.status === 'cancelled'}
                  onClick={() => setShowPricing(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] py-3 px-4 text-sm font-semibold text-white backdrop-blur-[20px] transition-all hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {pending === 'change-plan' ? <Loader2 className="animate-spin" size={16} /> : null}
                  Change Plan
                </button>
                <button
                  type="button"
                  disabled={busy || data.status === 'cancelled'}
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-[#ffb4ab] transition-all hover:bg-red-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {pending === 'cancel-plan' ? <Loader2 className="animate-spin" size={16} /> : null}
                  Cancel Plan
                </button>
              </div>
            </section>

            <section className={glassCardClass()}>
              <h3 className="mb-6 text-lg font-semibold text-white">Usage This Month</h3>
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/80">Rooms Used</span>
                    <span className="font-semibold text-white">
                      {data.usage.roomsUsed} / {data.usage.roomsLimit}
                    </span>
                  </div>
                  <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full shadow-[0_0_10px_rgba(231,195,101,0.35)] ${
                        roomsBar.exceeded ? 'bg-red-500' : 'bg-[#e7c365]'
                      }`}
                      style={{ width: `${roomsBar.pct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/80">Generations Used</span>
                    <span className="font-semibold text-white">
                      {data.usage.generationsUsed} / {data.usage.generationsLimit}
                    </span>
                  </div>
                  <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full shadow-[0_0_10px_rgba(231,195,101,0.35)] ${
                        genBar.exceeded ? 'bg-red-500' : 'bg-[#e7c365]'
                      }`}
                      style={{ width: `${genBar.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={glassCardClass()}>
              <h3 className="mb-5 text-lg font-semibold text-white">Payment Method</h3>
              <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-white/10">
                    <CreditCard size={20} className="text-white/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {data.paymentMethod.brand} ending in {data.paymentMethod.last4}
                    </p>
                    <p className="text-xs text-white/50">Expires {data.paymentMethod.expiry}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowPayment(true)}
                  className="shrink-0 text-sm font-bold text-[#cfbcff] hover:underline disabled:opacity-40"
                >
                  Change
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowPayment(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm font-semibold text-white/55 transition-colors hover:bg-white/5 disabled:opacity-40"
              >
                <Plus size={20} />
                Add New Payment Method
              </button>
            </section>

            <section className="space-y-4">
              <h3 className="px-2 text-lg font-semibold text-white">Invoices</h3>
              {data.invoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/18 bg-white/[0.04] px-5 py-12 text-center">
                  <p className="text-sm font-medium text-white/75">No invoices yet</p>
                  <p className="mt-1 text-xs text-white/45">They will appear here after your first charge.</p>
                </div>
              ) : (
                data.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="space-y-3 rounded-[20px] border border-white/[0.12] bg-white/[0.06] p-5 shadow-lg backdrop-blur-[20px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs tracking-wider text-white/40">#{inv.id}</span>
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${invoiceStatusStyle(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-white/50">{formatDisplayDate(inv.date)}</p>
                        <p className="text-lg font-bold text-white">{formatInr(inv.amount)}</p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handlePdf(inv)}
                          className="flex items-center gap-1 text-xs font-bold text-[#cfbcff] hover:opacity-80 disabled:opacity-40"
                        >
                          <Download size={16} />
                          PDF
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openInvoiceDetails(inv)}
                          className="text-xs font-bold text-white/50 hover:text-white disabled:opacity-40"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-4 py-8 text-center">
              <p className="text-sm text-white/55">Need help with billing?</p>
              <button
                type="button"
                disabled={busy}
                onClick={onContactSupport}
                className="rounded-full bg-white px-8 py-3 text-sm font-bold text-[#141218] shadow-lg transition-transform active:scale-95 disabled:opacity-45"
              >
                Contact Support
              </button>
            </section>

            {error && data ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[11px] text-white/55">Refresh failed: {error}</p>
                <button type="button" onClick={() => void reload()} className="text-[11px] font-semibold text-[#cfbcff]">
                  Retry
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>

      <BillingPricingPanel
        open={showPricing}
        currentPlanName={data?.planName ?? ''}
        currentPrice={data?.planPrice ?? 0}
        currentCycle={data?.billingCycle ?? 'monthly'}
        pending={pending === 'change-plan'}
        onClose={() => !busy && setShowPricing(false)}
        onSelectPlan={onPickPlan}
      />

      <BillingPaymentModal
        open={showPayment}
        pending={pending === 'update-payment'}
        onClose={() => setShowPayment(false)}
        onSubmit={async (input) => {
          await updatePayment(input)
        }}
      />

      <BillingInvoiceSheet
        open={sheetOpen}
        invoice={detailInvoice}
        planNameFallback={data?.planName ?? 'Plan'}
        onClose={closeSheet}
      />

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            key="cancel-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[125] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => !busy && setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#16141a] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white">Cancel subscription?</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Are you sure you want to cancel your plan? Your plan will remain active until the billing period ends.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 rounded-xl border border-white/14 py-3 text-sm font-semibold text-white/85 hover:bg-white/5 disabled:opacity-45"
                >
                  Keep plan
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmCancel()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/90 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-45"
                >
                  {pending === 'cancel-plan' ? <Loader2 className="animate-spin" size={16} /> : null}
                  Confirm cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

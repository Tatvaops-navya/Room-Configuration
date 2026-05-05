import { AnimatePresence, motion } from 'motion/react'
import type { BillingInvoice } from '@/lib/billing/types'

export function BillingInvoiceSheet({
  open,
  invoice,
  planNameFallback,
  onClose,
}: {
  open: boolean
  invoice: BillingInvoice | null
  planNameFallback: string
  onClose: () => void
}) {
  const period =
    invoice?.billingPeriodLabel ??
    (invoice
      ? new Date(invoice.date + 'T12:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '')

  return (
    <AnimatePresence>
      {open && invoice ? (
        <motion.div
          key="inv-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex flex-col justify-end bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="max-h-[85vh] overflow-y-auto rounded-t-[22px] border border-white/12 bg-[#16141a] px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/25" />
            <h2 className="text-lg font-semibold text-white">Invoice details</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-white/45">Invoice ID</dt>
                <dd className="mt-0.5 font-mono text-white">{invoice.id}</dd>
              </div>
              <div>
                <dt className="text-white/45">Plan</dt>
                <dd className="mt-0.5 text-white">{invoice.planName ?? planNameFallback}</dd>
              </div>
              <div>
                <dt className="text-white/45">Billing period</dt>
                <dd className="mt-0.5 text-white">{period}</dd>
              </div>
              <div>
                <dt className="text-white/45">Amount</dt>
                <dd className="mt-0.5 text-lg font-bold text-white">
                  ₹{invoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </dd>
              </div>
              <div>
                <dt className="text-white/45">Status</dt>
                <dd className="mt-0.5 capitalize text-white">{invoice.status}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full rounded-xl border border-white/14 bg-white/10 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

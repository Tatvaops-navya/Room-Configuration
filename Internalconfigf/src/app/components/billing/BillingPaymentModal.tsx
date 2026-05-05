import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import type { CardBrand } from '@/lib/billing/types'

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

function luhnValid(num: string): boolean {
  const d = digitsOnly(num)
  if (d.length < 13 || d.length > 19) return false
  let sum = 0
  let double = false
  for (let i = d.length - 1; i >= 0; i--) {
    let digit = parseInt(d[i]!, 10)
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

function guessBrand(pan: string): CardBrand {
  const c = pan.replace(/\D/g, '')[0]
  if (c === '5') return 'Mastercard'
  return 'Visa'
}

export function BillingPaymentModal({
  open,
  onClose,
  onSubmit,
  pending,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: { brand: CardBrand; last4: string; expiry: string }) => Promise<void>
  pending: boolean
}) {
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setNumber('')
    setExpiry('')
    setCvv('')
    setLocalError(null)
  }, [])

  const handleClose = () => {
    if (pending) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    setLocalError(null)
    const pan = digitsOnly(number)
    if (!luhnValid(pan)) {
      setLocalError('Please enter a valid card number.')
      return
    }
    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry.trim())) {
      setLocalError('Expiry must be MM/YY.')
      return
    }
    const [, mm, yy] = expiry.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/) ?? []
    const expFull = `${mm}/${yy}`
    const yFull = 2000 + parseInt(yy!, 10)
    const mNum = parseInt(mm!, 10) - 1
    const expEnd = new Date(yFull, mNum + 1, 0, 23, 59, 59, 999)
    if (expEnd < new Date()) {
      setLocalError('Card appears expired.')
      return
    }
    const cv = digitsOnly(cvv)
    if (cv.length < 3 || cv.length > 4) {
      setLocalError('CVV must be 3 or 4 digits.')
      return
    }
    const last4 = pan.slice(-4)
    const brand = guessBrand(pan)
    try {
      await onSubmit({ brand, last4, expiry: expFull })
      reset()
      onClose()
    } catch {
      // toast from parent
    }
  }

  const tree = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pay-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          style={{ padding: '1rem', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full max-w-md max-h-[min(88dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-y-contain rounded-2xl border border-white/12 bg-[#141218] p-5 pb-6 shadow-2xl sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add / replace card</h2>
              <button
                type="button"
                disabled={pending}
                onClick={handleClose}
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-xs text-white/50">
              Demo only — card data is validated locally; only brand, last four, and expiry are sent to the server.
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Card number</span>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  disabled={pending}
                  className="mt-1 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#cfbcff]/50"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Expiry</span>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    disabled={pending}
                    className="mt-1 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#cfbcff]/50"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/45">CVV</span>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    inputMode="numeric"
                    placeholder="123"
                    disabled={pending}
                    className="mt-1 w-full rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#cfbcff]/50"
                  />
                </label>
              </div>
              {localError ? <p className="text-xs font-medium text-red-400">{localError}</p> : null}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleSubmit()}
              className="mt-6 w-full rounded-xl bg-white py-3.5 text-sm font-bold text-[#141218] transition-opacity disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save payment method'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(tree, document.body)
}

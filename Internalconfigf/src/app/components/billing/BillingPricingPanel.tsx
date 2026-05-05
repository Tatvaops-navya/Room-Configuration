import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check } from 'lucide-react'
import type { BillingCycle } from '@/lib/billing/types'

export type PlanOption = {
  planName: string
  planPrice: number
  billingCycle: BillingCycle
  blurb: string
}

const DEFAULT_PLANS: PlanOption[] = [
  { planName: 'Starter', planPrice: 199, billingCycle: 'monthly', blurb: 'Solo projects · 2 rooms' },
  { planName: 'Studio', planPrice: 399, billingCycle: 'monthly', blurb: 'Growing teams · 5 rooms' },
  { planName: 'Pro Architect Plan', planPrice: 599, billingCycle: 'monthly', blurb: 'Full studio · 5 rooms, 25 gens' },
  { planName: 'Pro (Yearly)', planPrice: 5_799, billingCycle: 'yearly', blurb: 'Save vs monthly · billed annually' },
  { planName: 'Enterprise', planPrice: 1_299, billingCycle: 'monthly', blurb: 'Unlimited scale · contact sales' },
]

export function BillingPricingPanel({
  open,
  currentPlanName,
  currentPrice,
  currentCycle,
  onClose,
  onSelectPlan,
  pending,
}: {
  open: boolean
  currentPlanName: string
  currentPrice: number
  currentCycle: BillingCycle
  onClose: () => void
  onSelectPlan: (p: PlanOption) => Promise<void>
  pending: boolean
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pricing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[25] flex flex-col bg-[#0f0d0b]"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 disabled:opacity-50"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-base font-semibold text-white">Change plan</h2>
              <p className="text-[11px] text-white/50">Current: {currentPlanName} · ₹{currentPrice}/{currentCycle === 'yearly' ? 'yr' : 'mo'}</p>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28">
            <div className="mx-auto flex max-w-lg flex-col gap-3">
              {DEFAULT_PLANS.map((p) => {
                const active =
                  p.planName === currentPlanName && p.planPrice === currentPrice && p.billingCycle === currentCycle
                return (
                  <button
                    key={`${p.planName}-${p.billingCycle}`}
                    type="button"
                    disabled={pending || active}
                    onClick={() => void onSelectPlan(p)}
                    className={`flex w-full flex-col rounded-2xl border px-4 py-4 text-left transition-all ${
                      active
                        ? 'border-[#e7c365]/40 bg-[#e7c365]/10'
                        : 'border-white/12 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.09]'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[15px] font-semibold text-white">{p.planName}</div>
                        <div className="mt-1 text-xs text-white/55">{p.blurb}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">₹{p.planPrice.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                          /{p.billingCycle === 'yearly' ? 'year' : 'month'}
                        </div>
                      </div>
                    </div>
                    {active ? (
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#e7c365]">
                        <Check size={14} strokeWidth={3} />
                        Current plan
                      </div>
                    ) : (
                      <div className="mt-3 text-xs font-semibold text-[#cfbcff]">{pending ? 'Updating…' : 'Tap to switch'}</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { BillingCycle, CardBrand, UserBilling } from './types'
import {
  fetchBillingSummary,
  fetchInvoicesList,
  postCancelPlan,
  postChangePlan,
  postUpdatePayment,
} from './api'

const CACHE_KEY = 'tatvaops.billing.cache.v1'

function readCache(): UserBilling | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as UserBilling
    if (!v || typeof v !== 'object' || !Array.isArray(v.invoices)) return null
    return v
  } catch {
    return null
  }
}

function writeCache(b: UserBilling) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(b))
  } catch {
    // ignore quota
  }
}

export type BillingPending = 'load' | 'change-plan' | 'cancel-plan' | 'update-payment' | null

export function useBilling() {
  const [data, setData] = useState<UserBilling | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staleFromCache, setStaleFromCache] = useState(false)
  const [pending, setPending] = useState<BillingPending>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStaleFromCache(false)
    try {
      const [summary, inv] = await Promise.all([fetchBillingSummary(), fetchInvoicesList()])
      const merged: UserBilling = { ...summary, invoices: inv.invoices ?? [] }
      setData(merged)
      writeCache(merged)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load billing.'
      setError(msg)
      const cached = readCache()
      if (cached) {
        setData(cached)
        setStaleFromCache(true)
        toast.message('Using saved billing data', {
          description: 'Could not reach the server. Pull to retry or tap Retry.',
        })
      } else {
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const changePlan = useCallback(
    async (input: { planName: string; planPrice: number; billingCycle: BillingCycle }) => {
      setPending('change-plan')
      try {
        const next = await postChangePlan(input)
        setData(next)
        writeCache(next)
        setStaleFromCache(false)
        toast.success('Plan updated successfully')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not change plan.')
        throw err
      } finally {
        setPending(null)
      }
    },
    []
  )

  const cancelPlan = useCallback(async () => {
    setPending('cancel-plan')
    try {
      const next = await postCancelPlan()
      setData(next)
      writeCache(next)
      setStaleFromCache(false)
      toast.success('Your plan will remain active until the billing period ends.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel plan.')
      throw err
    } finally {
      setPending(null)
    }
  }, [])

  const updatePayment = useCallback(async (input: { brand: CardBrand; last4: string; expiry: string }) => {
    setPending('update-payment')
    try {
      const next = await postUpdatePayment(input)
      setData(next)
      writeCache(next)
      setStaleFromCache(false)
      toast.success('Payment method updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update payment.')
      throw err
    } finally {
      setPending(null)
    }
  }, [])

  return {
    data,
    loading,
    error,
    staleFromCache,
    pending,
    reload: load,
    changePlan,
    cancelPlan,
    updatePayment,
  }
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isSpaciaSignedIn } from '@/app/lib/auth/spaciaSession'
import type { OnboardingAnswers } from '@/app/lib/userProfile/types'
import { EMPTY_ONBOARDING_ANSWERS } from '@/app/lib/userProfile/types'
import { loadUserProfile, saveOnboardingToProfile } from '@/app/lib/userProfile/service'
import { ONBOARDING_DRAFT_KEY, ONBOARDING_STEPS } from '@/app/components/onboarding/onboardingConfig'
import { OnboardingOptionCard } from '@/app/components/onboarding/OnboardingOptionCard'
import { OnboardingProgress } from '@/app/components/onboarding/OnboardingProgress'
import { STEP_OPTION_ICONS } from '@/app/components/onboarding/stepIcons'

type DraftV1 = {
  v: 1
  step: 1 | 2 | 3 | 4
  answers: Partial<OnboardingAnswers>
}

function readDraft(): DraftV1 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(ONBOARDING_DRAFT_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as DraftV1
    if (p?.v !== 1 || typeof p.step !== 'number') return null
    return p
  } catch {
    return null
  }
}

function writeDraft(step: 1 | 2 | 3 | 4, answers: Partial<OnboardingAnswers>) {
  if (typeof window === 'undefined') return
  try {
    const d: DraftV1 = { v: 1, step, answers }
    window.sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(d))
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(ONBOARDING_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export function OnboardingQuestionsFlow() {
  const router = useRouter()
  const [booting, setBooting] = useState(true)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({})
  const [selection, setSelection] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const submitLockRef = useRef(false)

  const stepDef = ONBOARDING_STEPS[step - 1]

  const bootRunIdRef = useRef(0)

  useEffect(() => {
    const runId = ++bootRunIdRef.current
    ;(async () => {
      if (!isSpaciaSignedIn()) {
        if (bootRunIdRef.current !== runId) return
        router.replace('/login')
        return
      }
      const profile = await loadUserProfile()
      if (bootRunIdRef.current !== runId) return
      if (profile.onboardingCompleted) {
        router.replace('/home')
        return
      }
      const draft = readDraft()
      if (draft?.answers && typeof draft.step === 'number') {
        setAnswers((prev) => ({ ...prev, ...draft.answers }))
        const s = draft.step
        if (s >= 1 && s <= 4) setStep(s as 1 | 2 | 3 | 4)
        const field = ONBOARDING_STEPS[(draft.step as number) - 1]?.field
        if (field && draft.answers[field]) setSelection(String(draft.answers[field]))
      }
      setBooting(false)
    })()
  }, [router])

  useEffect(() => {
    if (booting) return
    const field = stepDef.field
    const existing = answers[field]
    setSelection(typeof existing === 'string' && existing ? existing : null)
  }, [booting, step, stepDef.field, answers])

  useEffect(() => {
    if (booting) return
    writeDraft(step, answers)
  }, [booting, step, answers])

  const iconsForStep = useMemo(() => STEP_OPTION_ICONS[step - 1] ?? [], [step])

  const handleSelect = (label: string) => {
    setSelection(label)
    setSaveError(null)
    setAnswers((prev) => ({ ...prev, [stepDef.field]: label }))
  }

  const goNext = () => {
    if (!selection) return
    setSaveError(null)
    if (step >= 4) return
    const next = (step + 1) as 1 | 2 | 3 | 4
    setStep(next)
    const nextField = ONBOARDING_STEPS[next - 1].field
    const nextAns = answers[nextField]
    setSelection(typeof nextAns === 'string' ? nextAns : null)
  }

  const handleFinalSubmit = async () => {
    if (!selection || saving) return
    const full: OnboardingAnswers = {
      ...EMPTY_ONBOARDING_ANSWERS,
      ...answers,
      [stepDef.field]: selection,
    }
    const keys: (keyof OnboardingAnswers)[] = ['reasonForUsingApp', 'userType', 'designExperience', 'planningStage']
    for (const k of keys) {
      if (!full[k]?.trim()) return
    }
    if (submitLockRef.current) return
    submitLockRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      const result = await saveOnboardingToProfile(full)
      if (!result.ok) {
        setSaveError(result.error)
        submitLockRef.current = false
        setSaving(false)
        return
      }
      clearDraft()
      await loadUserProfile()
      router.replace('/home')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Something went wrong.')
      submitLockRef.current = false
      setSaving(false)
    }
  }

  const goBack = () => {
    if (step <= 1) return
    setSaveError(null)
    const prev = (step - 1) as 1 | 2 | 3 | 4
    setStep(prev)
    const prevField = ONBOARDING_STEPS[prev - 1].field
    const prevAns = answers[prevField]
    setSelection(typeof prevAns === 'string' ? prevAns : null)
  }

  const ctaLabel = step === 4 ? 'Start Designing' : 'Continue'
  const ctaDisabled = !selection || saving

  if (booting) {
    return (
      <div className="ob-root ob-root--center">
        <div className="ob-spinner" aria-busy aria-label="Loading" />
        <style jsx>{`
          .ob-root {
            min-height: 100dvh;
            width: 100%;
            background: #1a1510;
            color: #f5f0e8;
          }
          .ob-root--center {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ob-spinner {
            width: 36px;
            height: 36px;
            border-radius: 999px;
            border: 3px solid rgba(255, 255, 255, 0.12);
            border-top-color: #e8873a;
            animation: spin 0.75s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="ob-root">
      <div
        className="ob-bg"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(26,21,16,0.55) 0%, rgba(26,21,16,0.92) 55%, #1a1510 100%), url("' +
            stepDef.heroImage +
            '")',
        }}
        aria-hidden
      />
      <div className="ob-glow" aria-hidden />

      <main className="ob-shell">
        <header className="ob-top">
          <button type="button" className="ob-back" onClick={goBack} aria-label="Back" disabled={step <= 1 || saving}>
            <span className="ob-backIcon" aria-hidden />
          </button>
          <div className="ob-topTitle">Tell us about you</div>
          <div className="ob-topSpacer" aria-hidden />
        </header>

        <OnboardingProgress current={step} />

        <p className="ob-kicker">Let&apos;s personalize your design journey</p>
        <h1 className="ob-q">{stepDef.question}</h1>

        <div className="ob-heroWrap">
          <img src={stepDef.heroImage} alt="" className="ob-hero" />
        </div>

        <div className="ob-options" role="list">
          {stepDef.options.map((opt, idx) => (
            <div key={opt} role="listitem">
              <OnboardingOptionCard
                label={opt}
                selected={selection === opt}
                onSelect={() => handleSelect(opt)}
                icon={iconsForStep[idx] ?? <span />}
                disabled={saving}
              />
            </div>
          ))}
        </div>

        {saveError && (
          <div className="ob-err" role="alert">
            {saveError}
          </div>
        )}

        <div className="ob-footer">
          <button
            type="button"
            className="ob-cta"
            disabled={ctaDisabled}
            onClick={() => {
              if (step === 4) void handleFinalSubmit()
              else goNext()
            }}
          >
            {saving ? 'Saving…' : ctaLabel}
            <span className="ob-ctaArrow" aria-hidden />
          </button>
        </div>
      </main>

      <style jsx>{`
        .ob-root {
          position: relative;
          min-height: 100dvh;
          width: 100%;
          overflow-x: hidden;
          background: #1a1510;
          color: #f5f0e8;
        }
        .ob-bg {
          position: fixed;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(18px) saturate(1.05);
          transform: scale(1.08);
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
        }
        .ob-glow {
          position: fixed;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 520px;
          height: 320px;
          background: rgba(232, 135, 58, 0.14);
          border-radius: 999px;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .ob-shell {
          position: relative;
          z-index: 1;
          max-width: 480px;
          margin: 0 auto;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding: max(env(safe-area-inset-top), 14px) 18px max(env(safe-area-inset-bottom), 20px);
          gap: 14px;
        }
        .ob-top {
          display: grid;
          grid-template-columns: 42px 1fr 42px;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .ob-topTitle {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: rgba(245, 240, 232, 0.92);
        }
        .ob-topSpacer {
          width: 42px;
        }
        .ob-back {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 160ms ease;
        }
        .ob-back:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .ob-backIcon {
          width: 10px;
          height: 10px;
          border-left: 2px solid rgba(245, 240, 232, 0.92);
          border-bottom: 2px solid rgba(245, 240, 232, 0.92);
          transform: rotate(45deg);
          margin-left: 3px;
        }
        .ob-kicker {
          margin: 4px 0 0;
          font-size: 12px;
          font-weight: 600;
          color: rgba(197, 160, 112, 0.92);
          letter-spacing: 0.02em;
        }
        .ob-q {
          margin: 0;
          font-size: clamp(22px, 5.2vw, 26px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.2;
          color: rgba(245, 240, 232, 0.98);
        }
        .ob-heroWrap {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.4);
          margin-top: 4px;
        }
        .ob-hero {
          display: block;
          width: 100%;
          height: 140px;
          object-fit: cover;
        }
        .ob-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }
        .ob-err {
          font-size: 13px;
          font-weight: 600;
          color: rgba(248, 113, 113, 0.95);
          text-align: center;
        }
        .ob-footer {
          margin-top: auto;
          padding-top: 10px;
        }
        .ob-cta {
          width: 100%;
          height: 54px;
          border-radius: 14px;
          border: 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 800;
          color: rgba(14, 14, 14, 0.95);
          background: linear-gradient(90deg, rgba(217, 119, 6, 1) 0%, rgba(245, 158, 11, 1) 100%);
          box-shadow: 0 8px 22px rgba(245, 158, 11, 0.18);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 140ms ease, opacity 140ms ease;
        }
        .ob-cta:disabled {
          opacity: 0.52;
          cursor: not-allowed;
        }
        .ob-cta:active:not(:disabled) {
          transform: scale(0.98);
        }
        .ob-ctaArrow {
          width: 10px;
          height: 10px;
          border-right: 3px solid rgba(14, 14, 14, 0.9);
          border-top: 3px solid rgba(14, 14, 14, 0.9);
          transform: rotate(45deg);
        }
      `}</style>
    </div>
  )
}

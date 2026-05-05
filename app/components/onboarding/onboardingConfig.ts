import type { OnboardingAnswers } from '@/app/lib/userProfile/types'

export type OnboardingStepField = keyof OnboardingAnswers

export type OnboardingStepDef = {
  stepIndex: 1 | 2 | 3 | 4
  field: OnboardingStepField
  question: string
  options: readonly string[]
  /** Decorative hero — matches premium interior marketing screens */
  heroImage: string
}

const HERO_LIVING =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1UU98rYsK8SyyDDfJg5bGJSm__C4a8UjHygOr3lkn8Lc2vL2j0K0Op3cUyuiEZv7i2XJGpBLpKAGTsfLZYbm8lDsZCg9KDBQEFxWbEPH2bta1el6BlsSP70JzjKJvQszHRPtdGIOJyK78DuRZI4_kdEc1TdH12YWQhXlbkpn5ilHBkzyPEuxjLwNS5PVhP0MSwgfIpYV-QFr-UQKs_mmkx5ZOidkW4N-FpnQy1r2nsKnZ7Y-AbhSZ4bFA_lI7Cqtb2D6stNUsm_kE'

const HERO_VILLA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA23YRBDcLoz_fSV-y03CgWk4JgBalAtUGz6obRdPoZHox2ZrhB1DQyXfCQ9ku1wtdXSIeweC0Yqemv2mzzPbxGX_fQTUj-HXylG39k0o99LgD1kJZdKvFk1-0YyUiInNfvQJiUXjZin1Ynn9PaOqpUQWCPiCCX9bCuc1YWOkCrwyv-pY5kMi__Y80_HXamUxjSoLwJ-EfNTcot9DW7aMMmYAdMCQe-GnXxvRiIMDxrVmzd7M7N_R2OJdupTkG9g19Uwc5K6ksGmvsu'

const HERO_DESK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB0tdM-564nn0QpuYJ_LT_yv4l2ozkuU6n7ellKnp9KeEwT27fCkhpaHA5grS2ozdSO_vY6xSFP0H25RZoGkuomjDOwQbcvnUetdorL6zsSlNPGlDzYUNrleDFx5UeJSXNvvUdufWIdAJTLIchNX_v2zcZwxIpIVIUwHDt-yV9pYX_exXH39GYQNLo3BlBTzpvLBEmPkH7c74oNkVRFVcBLvaWXlmJ8mTbnhZMmZIebqkg0sGNFovFRoyUmXSy_QQ3Kabo3j0fclcuQ'

export const ONBOARDING_STEPS: readonly OnboardingStepDef[] = [
  {
    stepIndex: 1,
    field: 'reasonForUsingApp',
    question: 'What brings you here today?',
    options: ['Explore ideas', 'Design a new home', 'Renovate my space', 'Redecorate a room'] as const,
    heroImage: HERO_LIVING,
  },
  {
    stepIndex: 2,
    field: 'userType',
    question: 'What best describes you?',
    options: ['Homeowner', 'First-time home buyer', 'Interior designer / architect', 'Just exploring'] as const,
    heroImage: HERO_VILLA,
  },
  {
    stepIndex: 3,
    field: 'designExperience',
    question: 'Have you designed a space before?',
    options: ['Yes, multiple times', 'Once or twice', 'Never'] as const,
    heroImage: HERO_DESK,
  },
  {
    stepIndex: 4,
    field: 'planningStage',
    question: 'Are you planning real changes or just ideas?',
    options: ['Just exploring ideas', 'Planning soon', 'Actively working on it'] as const,
    heroImage: HERO_LIVING,
  },
] as const

export const ONBOARDING_DRAFT_KEY = 'spacia.onboarding.draft.v1'

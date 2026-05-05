/**
 * Onboarding answers persisted for the signed-in user.
 * Values are the exact option labels shown in the UI (stable for analytics if needed later).
 */
export type OnboardingAnswers = {
  reasonForUsingApp: string
  userType: string
  designExperience: string
  planningStage: string
}

export type UserProfile = {
  onboardingCompleted: boolean
  onboardingAnswers: OnboardingAnswers | null
}

export const EMPTY_ONBOARDING_ANSWERS: OnboardingAnswers = {
  reasonForUsingApp: '',
  userType: '',
  designExperience: '',
  planningStage: '',
}

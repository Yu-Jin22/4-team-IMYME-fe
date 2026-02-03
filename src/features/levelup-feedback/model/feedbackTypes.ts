export type FeedbackStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
export type FeedbackProcessingStep = 'AUDIO_ANALYSIS' | 'FEEDBACK_GENERATION'

export type FeedbackItem = {
  id: number
  attemptNo: number
  summary?: string
  keywords?: string
  facts?: string
  understanding?: string
  socraticFeedback?: string
  createdAt: Date
}

export const PROCESSING_STEPS = ['AUDIO_ANALYSIS', 'FEEDBACK_GENERATION'] as const

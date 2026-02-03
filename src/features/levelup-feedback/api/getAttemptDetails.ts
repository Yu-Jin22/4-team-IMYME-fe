import { httpClient } from '@/shared'

export type AttemptFeedback = {
  id: number
  attemptNo: number
  overallScore: number
  level: number
  summary: string
  keywords: string
  facts: string
  understanding: string
  socraticFeedback: string
  createdAt: Date
}

export type AttemptDetails = {
  attemptId: number
  attemptNo: number
  cardId: number
  status: string
  step?: string
  audioUrl: string
  durationSeconds: number
  sttText: string
  feedback: AttemptFeedback
  createdAt: string
  uploadedAt: string
  finishedAt: string
  failedAt: string
  expiresAt: string
  expiredAt: string
  estimatedCompletionAt: string
  retryAfterSeconds: number
  remainingSeconds: number
  errorMessage: string
  retryAvailable: boolean
  message: string
}

type AttemptDetailsResponse = {
  data?: AttemptDetails
}

export async function getAttemptDetails(
  accessToken: string,
  cardId: number | undefined,
  attemptId: number | undefined,
): Promise<AttemptDetails | null> {
  try {
    const response = await httpClient.get<AttemptDetailsResponse>(
      `/cards/${cardId}/attempts/${attemptId}`,
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      },
    )

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to fetch attempt details', error)
    return null
  }
}

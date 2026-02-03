import { httpClient } from '@/shared'

export type CardAttempt = {
  id: number
  attemptNo: number
  status: string
  audioUrl: string
  createdAt: string
}

export type CardDetails = {
  id: number
  title: string
  categoryId: number
  categoryName: string
  keywordId: number
  keywordName: string
  bestLevel: number
  attemptCount: number
  createdAt: string
  attempts: CardAttempt[]
}

type CardDetailsResponse = {
  data?: CardDetails
}

export type CardAttemptSummary = {
  id: number
  attemptNo: number
  status: string
  createdAt: string
}

export async function getCardDetails(
  accessToken: string,
  cardId: number | undefined,
): Promise<CardDetails | null> {
  try {
    const response = await httpClient.get<CardDetailsResponse>(`/cards/${cardId}`, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to fetch card details', error)
    return null
  }
}

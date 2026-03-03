import { proxyApiClient } from '@/shared/api'

type CreateCardPayload = {
  categoryId: number
  keywordId: number
  title: string
}

type CreateCardResponse = {
  data?: {
    id: number
    categoryId: number
    categoryName: string
    keywordId: number
    keywordName: string
    title: string
    attemptCount: number
    createdAt: string
  }
}

export async function createCard(payload: CreateCardPayload) {
  try {
    const response = await proxyApiClient.post<CreateCardResponse>('/proxy-api/cards', payload)

    return response.data
  } catch (error) {
    console.error('Failed to create card', error)
    return null
  }
}

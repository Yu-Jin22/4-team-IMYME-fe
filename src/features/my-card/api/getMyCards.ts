import { proxyApiClient } from '@/shared/api'

export type MyCardItem = {
  id: number
  title: string
  createdAt: string
  categoryId: number
  categoryName: string
  keywordId: number
  keywordName: string
}

type MyCardsResponse = {
  data?: {
    cards?: MyCardItem[]
  }
}

const MY_CARDS_PROXY_PATH = '/proxy-api/cards'

export async function getMyCards(limit?: number): Promise<MyCardItem[]> {
  try {
    const response = await proxyApiClient.get<MyCardsResponse>(MY_CARDS_PROXY_PATH, {
      params: {
        ...(limit ? { limit } : {}),
        ghost: false,
      },
    })
    const payload = response.data
    return payload.data?.cards ?? []
  } catch (error) {
    console.error('Failed to fetch cards', error)
    return []
  }
}

import { proxyApiClient } from '@/shared/api'

import type { KeywordItemType } from '@/entities/keyword'

interface KeywordApiItem {
  id: number
  name: string
  displayOrder: string
  isActive: boolean
}

interface KeywordApiResponse {
  data?: {
    keywords?: KeywordApiItem[]
  }
  keywords?: KeywordApiItem[]
}

export async function getKeywords(categoryId: number | null): Promise<KeywordItemType[]> {
  try {
    const response = await proxyApiClient.get<KeywordApiResponse>(
      `/proxy-api/categories/${categoryId}/keywords`,
    )

    const items = response.data?.data?.keywords ?? response.data?.keywords ?? []

    return items.map((item) => ({
      id: item.id,
      keywordName: item.name,
    }))
  } catch (error) {
    console.error('Failed to fetch keywords', error)
    return []
  }
}

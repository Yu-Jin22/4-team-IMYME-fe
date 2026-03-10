import { proxyApiClient } from '@/shared/api'

import type { CategoryItemType } from '@/entities/category'

type CategoryApiItem = {
  id: number
  name: string
  displayOrder: string
  isActive: boolean
}

type CategoryApiResponse = {
  data?: CategoryApiItem[]
}

export async function getCategories(): Promise<CategoryItemType[]> {
  try {
    const response = await proxyApiClient.get<CategoryApiResponse>('/proxy-api/categories')

    const items = response.data?.data ?? []

    return items.map((item) => ({
      id: item.id,
      categoryName: item.name,
    }))
  } catch (error) {
    console.error('Failed to fetch categories', error)
    return []
  }
}

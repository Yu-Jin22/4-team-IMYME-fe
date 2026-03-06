import { httpClient } from '@/shared/api'

import type { CategoryItemType } from '@/entities/category'

type CategoryApiItem = {
  id: number
  name: string
}

type CategoryApiResponse = {
  data?: CategoryApiItem[]
}

export async function getInitialCategories(accessToken: string): Promise<CategoryItemType[]> {
  if (!accessToken) {
    return []
  }

  try {
    const response = await httpClient.get<CategoryApiResponse>('/categories', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const items = response.data?.data ?? []
    return items.map((item) => ({
      id: item.id,
      categoryName: item.name,
    }))
  } catch {
    return []
  }
}

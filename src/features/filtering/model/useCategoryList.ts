'use client'

import { useQuery } from '@tanstack/react-query'

import { getCategories } from '../api/getCategories'

import type { CategoryItemType } from '@/entities/category'

type UseCategoryListOptions = {
  initialData?: CategoryItemType[]
}

export function useCategoryList({ initialData }: UseCategoryListOptions = {}) {
  // 빈 배열은 "초기 성공 데이터"로 고정되면 재요청을 막을 수 있어 시드로 사용하지 않는다.
  const hasInitialCategoryData = Boolean(initialData && initialData.length > 0)

  return useQuery<CategoryItemType[]>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    ...(hasInitialCategoryData ? { initialData } : {}),
    staleTime: 3600000,
  })
}

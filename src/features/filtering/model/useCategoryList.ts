'use client'

import { useQuery } from '@tanstack/react-query'

import { getCategories } from '../api/getCategories'

import type { CategoryItemType } from '@/entities/category'

type UseCategoryListOptions = {
  initialData?: CategoryItemType[]
}

export function useCategoryList({ initialData = [] }: UseCategoryListOptions = {}) {
  return useQuery<CategoryItemType[]>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    initialData,
    staleTime: 3600000,
  })
}

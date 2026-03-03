'use client'

import { useQuery } from '@tanstack/react-query'

import { getCategories } from '../api/getCategories'

import type { CategoryItemType } from '@/entities/category'

export function useCategoryList() {
  return useQuery<CategoryItemType[]>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    initialData: [],
  })
}

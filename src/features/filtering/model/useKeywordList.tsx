'use client'

import { useQuery } from '@tanstack/react-query'

import { getKeywords } from '../api/getKeywords'

import type { KeywordItemType } from '@/entities/keyword'

type UseKeywordListOptions = {
  categoryId: number | null
}

export function useKeywordList({ categoryId }: UseKeywordListOptions) {
  return useQuery<KeywordItemType[]>({
    queryKey: ['keywords', categoryId],
    queryFn: () => getKeywords(categoryId),
    enabled: categoryId !== null,
  })
}

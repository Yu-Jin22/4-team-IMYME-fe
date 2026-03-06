'use client'

import { useQuery } from '@tanstack/react-query'

import { getKeywords } from '../api/getKeywords'

import type { KeywordItemType } from '@/entities/keyword'

const KEYWORDS_QUERY_KEY = 'keywords'

type UseKeywordListOptions = {
  categoryId: number | null
}

export const getKeywordListQueryKey = (categoryId: number | null) =>
  [KEYWORDS_QUERY_KEY, categoryId] as const

export function useKeywordList({ categoryId }: UseKeywordListOptions) {
  return useQuery<KeywordItemType[]>({
    queryKey: getKeywordListQueryKey(categoryId),
    queryFn: () => getKeywords(categoryId),
    enabled: categoryId !== null,
    staleTime: 3600000,
  })
}

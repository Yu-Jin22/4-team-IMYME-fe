'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { getKeywordListQueryKey, getKeywords, useCategoryList } from '../../filtering'

import { CategorySelectSkeleton } from './CategorySelectSkeleton'

import type { CategoryItemType } from '@/entities/category'

type CategorySelectListProps = {
  initialCategories?: CategoryItemType[]
  selectedCategoryId: number | null
  onCategorySelectId: (category: CategoryItemType) => void
  onClearKeyword?: () => void
  variant?: 'default' | 'compact'
}

const KEYWORDS_PREFETCH_STALE_TIME_MS = 30 * 1000
const CATEGORY_LIST_CLASSNAME =
  'itmes-center grid min-h-0 w-full flex-1 grid-cols-2 place-items-center gap-6 overflow-y-scroll'
const CATEGORY_LOAD_ERROR_TOAST_MESSAGE = '카테고리를 불러오지 못했습니다.'

export function CategorySelectList({
  initialCategories,
  selectedCategoryId,
  onCategorySelectId,
  onClearKeyword,
  variant = 'default',
}: CategorySelectListProps) {
  const queryClient = useQueryClient()
  const prefetchedCategoryIdsRef = useRef<Set<number>>(new Set())
  const hasShownErrorToastRef = useRef(false)
  const { data, isLoading, error } = useCategoryList({ initialData: initialCategories })
  const categories: CategoryItemType[] = useMemo(() => data ?? [], [data])
  const buttonHeightClassName = variant === 'compact' ? 'h-20' : 'h-40'

  useEffect(() => {
    if (categories.length === 0) return

    for (const category of categories) {
      if (prefetchedCategoryIdsRef.current.has(category.id)) continue
      prefetchedCategoryIdsRef.current.add(category.id)

      void queryClient.prefetchQuery({
        queryKey: getKeywordListQueryKey(category.id),
        queryFn: () => getKeywords(category.id),
        staleTime: KEYWORDS_PREFETCH_STALE_TIME_MS,
      })
    }
  }, [categories, queryClient])

  useEffect(() => {
    if (!error) {
      hasShownErrorToastRef.current = false
      return
    }

    if (hasShownErrorToastRef.current) return
    hasShownErrorToastRef.current = true
    toast.error(CATEGORY_LOAD_ERROR_TOAST_MESSAGE)
  }, [error])

  const shouldShowCategorySkeleton = isLoading || categories.length === 0 || Boolean(error)

  if (shouldShowCategorySkeleton) {
    return <CategorySelectSkeleton variant={variant} />
  }

  return (
    <div className={CATEGORY_LIST_CLASSNAME}>
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id
        const selectedClassName = isSelected ? 'border border-2 border-primary' : ''

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              onCategorySelectId(category)
              if (onClearKeyword) onClearKeyword()
            }}
            className={`flex ${buttonHeightClassName} w-40 cursor-pointer items-center justify-center rounded-2xl bg-white ${selectedClassName}`}
          >
            <p>{category.categoryName}</p>
          </button>
        )
      })}
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useKeywordList } from '../../filtering/model/useKeywordList'

import { KeywordSelectSkeleton } from './KeywordSelectSkeleton'

import type { KeywordItemType } from '@/entities/keyword'

type KeywordSelectListProps = {
  categoryId: number | null
  selectedKeywordId: number | null
  onKeywordSelect: (keyword: KeywordItemType) => void
}

const KEYWORD_LIST_CLASSNAME = 'itmes-center flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto'
const KEYWORD_LOAD_ERROR_TOAST_MESSAGE = '키워드를 불러오지 못했습니다.'

export function KeywordSelectList({
  categoryId,
  selectedKeywordId,
  onKeywordSelect,
}: KeywordSelectListProps) {
  const hasShownErrorToastRef = useRef(false)
  const {
    data: keywords = [],
    isLoading,
    isError,
  } = useKeywordList({
    categoryId,
  })

  useEffect(() => {
    if (!isError) {
      hasShownErrorToastRef.current = false
      return
    }

    if (hasShownErrorToastRef.current) return
    hasShownErrorToastRef.current = true
    toast.error(KEYWORD_LOAD_ERROR_TOAST_MESSAGE)
  }, [isError])

  if (!categoryId) {
    return <p>카테고리를 선택해 주세요.</p>
  }

  const shouldShowKeywordSkeleton = isLoading || isError || keywords.length === 0

  if (shouldShowKeywordSkeleton) {
    return <KeywordSelectSkeleton />
  }

  return (
    <div className={KEYWORD_LIST_CLASSNAME}>
      {keywords.map((keyword) => {
        const isSelected = selectedKeywordId === keyword.id
        const selectedClassName = isSelected ? 'border border-secondary' : ''

        return (
          <button
            key={keyword.id}
            type="button"
            onClick={() => onKeywordSelect(keyword)}
            className={`flex min-h-10 w-80 cursor-pointer items-center justify-center rounded-2xl bg-white ${selectedClassName}`}
          >
            <p>{keyword.keywordName}</p>
          </button>
        )
      })}
    </div>
  )
}

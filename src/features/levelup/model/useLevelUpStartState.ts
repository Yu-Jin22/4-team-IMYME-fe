'use client'

import { useMemo, useState } from 'react'

import type { CategoryItemType } from '@/entities/category'
import type { KeywordItemType } from '@/entities/keyword'

const STEP_ONE_PROGRESS_VALUE = 33
const STEP_TWO_PROGRESS_VALUE = 66
const STEP_ONE_LABEL = '1/3'
const STEP_TWO_LABEL = '2/3'

type LevelUpStartStateResult = {
  selectedCategory: CategoryItemType | null
  selectedKeyword: KeywordItemType | null
  isNameDialogOpen: boolean
  hasSelectedCategory: boolean
  progressValue: number
  progressLabel: string
  setSelectedCategory: (category: CategoryItemType | null) => void
  handleKeywordSelect: (keyword: KeywordItemType) => void
  handleDialogOpenChange: (open: boolean) => void
  clearKeyword: () => void
  handleCancelName: () => void
}

export function useLevelUpStartState(): LevelUpStartStateResult {
  // 선택된 카테고리/키워드와 모달 상태
  const [selectedCategory, setSelectedCategory] = useState<CategoryItemType | null>(null)
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordItemType | null>(null)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)

  // 카테고리 선택 여부에 따라 단계 판단
  const hasSelectedCategory = selectedCategory !== null

  // 진행도와 라벨 계산 (단계에 따라 변경)
  const progressValue = useMemo(
    () => (hasSelectedCategory ? STEP_TWO_PROGRESS_VALUE : STEP_ONE_PROGRESS_VALUE),
    [hasSelectedCategory],
  )

  const progressLabel = useMemo(
    () => (hasSelectedCategory ? STEP_TWO_LABEL : STEP_ONE_LABEL),
    [hasSelectedCategory],
  )

  // 키워드 선택 시 이름 입력 모달 오픈
  const handleKeywordSelect = (keyword: KeywordItemType) => {
    setSelectedKeyword(keyword)
    setIsNameDialogOpen(true)
  }

  // 모달 열림/닫힘 외부 제어
  const handleDialogOpenChange = (open: boolean) => {
    setIsNameDialogOpen(open)
  }

  // 키워드 초기화
  const clearKeyword = () => {
    setSelectedKeyword(null)
  }

  // 모달 취소 시 상태 리셋
  const handleCancelName = () => {
    clearKeyword()
    setIsNameDialogOpen(false)
  }

  return {
    selectedCategory,
    selectedKeyword,
    isNameDialogOpen,
    hasSelectedCategory,
    progressValue,
    progressLabel,
    setSelectedCategory,
    handleKeywordSelect,
    handleDialogOpenChange,
    clearKeyword,
    handleCancelName,
  }
}

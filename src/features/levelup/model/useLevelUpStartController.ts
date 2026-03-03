'use client'

import { useLevelUpStartActions } from './useLevelUpStartActions'
import { useLevelUpStartState } from './useLevelUpStartState'

import type { CategoryItemType } from '@/entities/category'
import type { KeywordItemType } from '@/entities/keyword'

type LevelUpStartControllerResult = {
  accessToken: string
  selectedCategory: CategoryItemType | null
  selectedKeyword: KeywordItemType | null
  isNameDialogOpen: boolean
  hasSelectedCategory: boolean
  progressValue: number
  progressLabel: string
  handleKeywordSelect: (keyword: KeywordItemType) => void
  handleConfirmCardName: (title: string) => Promise<void>
  handleBack: () => void
  handleDialogOpenChange: (open: boolean) => void
  handleCancelName: () => void
  setSelectedCategory: (category: CategoryItemType | null) => void
  clearKeyword: () => void
}

export function useLevelUpStartController(): LevelUpStartControllerResult {
  // 상태/진행 계산 로직
  const {
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
  } = useLevelUpStartState()

  // 카드 생성/시도 생성/뒤로가기 액션 로직
  const { accessToken, handleConfirmCardName, handleBack } = useLevelUpStartActions({
    selectedCategory,
    selectedKeyword,
    onClearKeyword: clearKeyword,
    onClearCategory: () => setSelectedCategory(null),
    onCloseNameDialog: () => handleDialogOpenChange(false),
  })

  return {
    accessToken,
    selectedCategory,
    selectedKeyword,
    isNameDialogOpen,
    hasSelectedCategory,
    progressValue,
    progressLabel,
    handleKeywordSelect,
    handleConfirmCardName,
    handleBack,
    handleDialogOpenChange,
    handleCancelName,
    setSelectedCategory,
    clearKeyword,
  }
}

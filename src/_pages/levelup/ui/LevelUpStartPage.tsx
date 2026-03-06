'use client'

import dynamic from 'next/dynamic'

import {
  CategorySelectList,
  KeywordSelectList,
  useLevelUpStartController,
} from '@/features/levelup'
import { ModeHeader } from '@/shared'

import type { CategoryItemType } from '@/entities/category'

const loadCardNameModal = () => import('@/features/levelup').then((module) => module.CardNameModal)

const CardNameModalLazy = dynamic(loadCardNameModal)

type LevelUpStartPageProps = {
  initialCategories?: CategoryItemType[]
}

export function LevelUpStartPage({ initialCategories }: LevelUpStartPageProps) {
  const {
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
  } = useLevelUpStartController()

  return (
    <div className="h-full w-full">
      <ModeHeader
        mode="levelup"
        step={hasSelectedCategory ? 'keyword' : 'category'}
        onBack={handleBack}
        progressValue={progressValue}
        stepLabel={progressLabel}
      />
      <div className="bg-secondary mx-4 mt-4 flex max-h-[80vh] max-w-350 flex-col items-center justify-center overflow-hidden rounded-2xl p-4">
        {hasSelectedCategory ? (
          <KeywordSelectList
            categoryId={selectedCategory ? selectedCategory.id : null}
            selectedKeywordId={selectedKeyword ? selectedKeyword.id : null}
            onKeywordSelect={handleKeywordSelect}
          />
        ) : (
          <CategorySelectList
            initialCategories={initialCategories}
            selectedCategoryId={selectedCategory ? selectedCategory.id : null}
            onCategorySelectId={setSelectedCategory}
            onClearKeyword={clearKeyword}
          />
        )}
      </div>
      {isNameDialogOpen ? (
        <CardNameModalLazy
          open={isNameDialogOpen}
          onOpenChange={handleDialogOpenChange}
          selectedCategoryName={selectedCategory?.categoryName ?? null}
          selectedKeywordName={selectedKeyword?.keywordName ?? null}
          onCancel={handleCancelName}
          onConfirm={handleConfirmCardName}
        />
      ) : null}
    </div>
  )
}

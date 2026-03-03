'use client'

import { useRouter } from 'next/navigation'

import { useAccessToken } from '@/features/auth'
import { createCard, INITIAL_ATTEMPT_DURATION_SECONDS } from '@/features/levelup'
import { createAttempt } from '@/features/record'

import type { CategoryItemType } from '@/entities/category'
import type { KeywordItemType } from '@/entities/keyword'

type UseLevelUpStartActionsParams = {
  selectedCategory: CategoryItemType | null
  selectedKeyword: KeywordItemType | null
  onClearKeyword: () => void
  onClearCategory: () => void
  onCloseNameDialog: () => void
}

type UseLevelUpStartActionsResult = {
  accessToken: string
  handleConfirmCardName: (title: string) => Promise<void>
  handleBack: () => void
}

export function useLevelUpStartActions({
  selectedCategory,
  selectedKeyword,
  onClearKeyword,
  onClearCategory,
  onCloseNameDialog,
}: UseLevelUpStartActionsParams): UseLevelUpStartActionsResult {
  // 라우팅과 인증 토큰 사용
  const router = useRouter()
  const accessToken = useAccessToken()

  // 카드 생성 → 시도 생성 → 녹음 페이지로 이동
  const handleConfirmCardName = async (title: string) => {
    if (!selectedCategory || !selectedKeyword) return

    const response = await createCard(accessToken, {
      categoryId: selectedCategory.id,
      keywordId: selectedKeyword.id,
      title,
    })

    const createdCardId = response?.data?.id
    if (!createdCardId) return

    const attemptResponse = await createAttempt(
      accessToken,
      createdCardId,
      INITIAL_ATTEMPT_DURATION_SECONDS,
    )
    if (!attemptResponse.ok) return

    const attemptId = attemptResponse.data?.attemptId
    const attemptNo = attemptResponse.data?.attemptNo
    if (!attemptId) return

    // 모달 닫고 녹음 페이지로 이동
    onCloseNameDialog()
    router.replace(
      `/levelup/record?cardId=${createdCardId}&attemptId=${attemptId}&attemptNo=${attemptNo}`,
    )
  }

  // 단계별 뒤로가기 처리
  const handleBack = () => {
    if (selectedKeyword) {
      onClearKeyword()
      return
    }

    if (selectedCategory) {
      onClearCategory()
      return
    }

    router.back()
  }

  return {
    accessToken,
    handleConfirmCardName,
    handleBack,
  }
}

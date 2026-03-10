'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useCardDetails, useFeedbackStream } from '@/features/levelup-feedback'

const FAILED_REDIRECT_DELAY_MS = 3000
const MAX_ATTEMPTS = 5
const MAIN_PAGE_PATH = '/main'

type LevelUpFeedbackControllerDeps = {
  createAttempt: (
    cardId: number,
    initialDurationSeconds: number,
  ) => Promise<{ ok: boolean; data?: { attemptId?: number; attemptNo?: number } }>
  deleteAttempt: (cardId: number, attemptId: number) => Promise<{ ok: boolean }>
  initialAttemptDurationSeconds: number
  onIncreaseActiveCardCount: () => void
}

export function useLevelUpFeedbackController({
  createAttempt,
  deleteAttempt,
  initialAttemptDurationSeconds,
  onIncreaseActiveCardCount,
}: LevelUpFeedbackControllerDeps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCreatingAttempt, setIsCreatingAttempt] = useState(false)
  const cardId = Number(searchParams.get('cardId') ?? '')
  const attemptId = Number(searchParams.get('attemptId') ?? '')
  const { data } = useCardDetails(cardId)

  const deleteAttemptMutation = useMutation({
    mutationFn: async () => {
      if (!cardId || !attemptId) {
        throw new Error('missing_params')
      }
      const result = await deleteAttempt(cardId, attemptId)
      if (!result.ok) {
        throw new Error('delete_failed')
      }
    },
    retry: 1,
  })

  const handleTimeout = useCallback(async () => {
    toast.error('피드백 생성 시간이 초과되었습니다.')
    try {
      await deleteAttemptMutation.mutateAsync()
    } catch {
      toast.error('삭제에 실패했습니다. 다시 시도해주세요.')
    }
    router.push(MAIN_PAGE_PATH)
  }, [deleteAttemptMutation, router])

  const handleFailed = useCallback(() => {
    toast.error('피드백 생성에 실패했습니다. 다시 시도해주세요.')
    window.setTimeout(() => {
      router.push(MAIN_PAGE_PATH)
    }, FAILED_REDIRECT_DELAY_MS)
  }, [router])

  // 기존 polling 훅 대신 SSE 기반 훅으로 상태/step/결과 데이터를 수신한다.
  const { status, processingStep, feedbackData } = useFeedbackStream({
    cardId,
    attemptId,
    onTimeout: handleTimeout,
    onFailed: handleFailed,
  })

  const feedbackAttemptNo = feedbackData[0]?.attemptNo ?? 0
  const remainingAttempts =
    feedbackData.length > 0 ? Math.max(0, MAX_ATTEMPTS - feedbackAttemptNo) : '-'

  const handleBack = () => router.push(MAIN_PAGE_PATH)

  const handleRestudyClick = async () => {
    if (!cardId) {
      toast.error('카드 정보를 찾을 수 없습니다.')
      return
    }
    setIsCreatingAttempt(true)
    const response = await createAttempt(cardId, initialAttemptDurationSeconds)
    setIsCreatingAttempt(false)
    if (!response.ok) {
      toast.error('학습 시작을 준비하지 못했습니다. 다시 시도해주세요.')
      return
    }

    const nextAttemptId = response.data?.attemptId
    const nextAttemptNo = response.data?.attemptNo
    if (!nextAttemptId || !nextAttemptNo) {
      toast.error('학습 시도를 준비하지 못했습니다. 다시 시도해주세요.')
      return
    }

    router.push(
      `/levelup/record?cardId=${cardId}&attemptId=${nextAttemptId}&attemptNo=${nextAttemptNo}`,
    )
  }

  const handleEndLearning = () => {
    if (status === 'COMPLETED') {
      onIncreaseActiveCardCount()
    }
    router.replace(MAIN_PAGE_PATH)
  }

  const isRestudyDisabled = remainingAttempts === 0 || isCreatingAttempt

  return {
    data,
    status,
    processingStep,
    feedbackData,
    remainingAttempts,
    isRestudyDisabled,
    handleBack,
    handleRestudyClick,
    handleEndLearning,
  }
}

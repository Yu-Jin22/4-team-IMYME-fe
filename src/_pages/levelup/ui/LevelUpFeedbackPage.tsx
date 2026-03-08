'use client'

import { useOptimisticActiveCardCount } from '@/entities/user'
import { INITIAL_ATTEMPT_DURATION_SECONDS } from '@/features/levelup'
import {
  deleteAttempt,
  FeedbackTab,
  useLevelUpFeedbackController,
} from '@/features/levelup-feedback'
import { createAttempt } from '@/features/record'
import { Button, ModeHeader, StatusLoader, SubjectHeader } from '@/shared'

const ACTIVE_CARD_COUNT_INCREMENT = 1

export function LevelUpFeedbackPage() {
  const { applyDelta } = useOptimisticActiveCardCount()
  const {
    data,
    status,
    processingStep,
    feedbackData,
    remainingAttempts,
    isRestudyDisabled,
    handleBack,
    handleRestudyClick,
    handleEndLearning,
  } = useLevelUpFeedbackController({
    createAttempt,
    deleteAttempt,
    initialAttemptDurationSeconds: INITIAL_ATTEMPT_DURATION_SECONDS,
    onIncreaseActiveCardCount: () => applyDelta(ACTIVE_CARD_COUNT_INCREMENT),
  })
  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <ModeHeader
        mode="levelup"
        step="feedback"
        onBack={handleBack}
        title={data?.title ?? undefined}
        progressValue={100}
        stepLabel="3/3"
      />
      <SubjectHeader
        variant="in_progress"
        categoryValue={data?.categoryName ?? ''}
        keywordValue={data?.keywordName ?? ''}
      />
      <div className="min-h-0 flex-1">
        {status === 'COMPLETED' && feedbackData.length > 0 ? (
          <FeedbackTab
            feedbackData={feedbackData}
            showButtons={false}
          />
        ) : (
          <StatusLoader
            status={status}
            step={processingStep}
          />
        )}
      </div>
      <div className="mt-auto flex w-full flex-col items-center justify-center gap-4">
        <p className="mb-3 text-sm">남은 학습 횟수: {remainingAttempts}</p>
        <div className="mb-6 flex w-full items-center justify-center gap-4">
          <Button
            variant="levelup_feedback_btn"
            onClick={handleRestudyClick}
            disabled={isRestudyDisabled}
          >
            이어서 학습하기
          </Button>
          <Button
            variant="levelup_feedback_btn"
            onClick={handleEndLearning}
          >
            학습 종료하기
          </Button>
        </div>
      </div>
    </div>
  )
}

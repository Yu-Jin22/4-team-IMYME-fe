'use client'

import { useSearchParams } from 'next/navigation'
import { memo } from 'react'

import { useCardDetails } from '@/features/levelup-feedback'
import { MicrophoneBox, useLevelUpRecordController } from '@/features/record'
import { AlertModal, Button, ModeHeader, RecordTipBox, StatusLoader, SubjectHeader } from '@/shared'

import { useLevelUpRecordExitGuard } from '../model/useLevelUpRecordExitGuard'

const RECORD_PROGRESS_VALUE = 100
const RECORD_STEP_LABEL = '3/3'

type RecordSubmitButtonProps = {
  onComplete: () => Promise<void>
  isSubmitting: boolean
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (!value) return undefined

  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? undefined : parsedValue
}

const RecordSubmitButton = memo(function RecordSubmitButton({
  onComplete,
  isSubmitting,
}: RecordSubmitButtonProps) {
  return (
    <div className="mt-auto mb-6 flex w-full items-center justify-center gap-4 pt-4">
      <Button
        variant="record_confirm_btn"
        onClick={onComplete}
        disabled={isSubmitting}
      >
        녹음 완료 및 피드백 받기
      </Button>
    </div>
  )
})

export function LevelUpRecordPage() {
  const searchParams = useSearchParams()
  const cardId = parseOptionalNumber(searchParams.get('cardId'))
  const attemptId = parseOptionalNumber(searchParams.get('attemptId'))
  const attemptNo = parseOptionalNumber(searchParams.get('attemptNo'))
  const { data } = useCardDetails(cardId)

  const {
    isSubmittingFeedback,
    uploadStatus,
    isStartingWarmup,
    warmupError,
    isMicAlertOpen,
    isRecording,
    isPaused,
    getElapsedSeconds,
    recordedBlob,
    handleMicClick,
    handleMicAlertOpenChange,
    handleRecordingComplete,
  } = useLevelUpRecordController({
    cardId,
    attemptId,
    attemptNo,
  })
  const { isBackAlertOpen, handleBackConfirm, handleBackCancel, handleBackAlertOpenChange } =
    useLevelUpRecordExitGuard()

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <ModeHeader
        mode="levelup"
        step="recording"
        onBack={() => handleBackAlertOpenChange(true)}
        progressValue={RECORD_PROGRESS_VALUE}
        stepLabel={RECORD_STEP_LABEL}
      />
      <SubjectHeader
        variant="in_progress"
        categoryValue={data?.categoryName ?? ''}
        keywordValue={data?.keywordName ?? ''}
      />
      {isSubmittingFeedback || uploadStatus === 'PENDING' ? (
        <StatusLoader status="PENDING" />
      ) : (
        <MicrophoneBox
          isStartingWarmup={isStartingWarmup}
          warmupError={warmupError}
          onMicClick={handleMicClick}
          title="음성으로 말해보세요."
          description="버튼을 눌러 녹음을 시작하세요."
          errorMessage="녹음 시작에 실패했습니다. 메인으로 이동합니다."
          isMicDisabled={Boolean(recordedBlob)}
          isRecording={isRecording}
          isPaused={isPaused}
          getElapsedSeconds={getElapsedSeconds}
        />
      )}
      <RecordTipBox />
      <RecordSubmitButton
        onComplete={handleRecordingComplete}
        isSubmitting={isSubmittingFeedback}
      />
      <AlertModal
        open={isBackAlertOpen}
        onOpenChange={handleBackAlertOpenChange}
        title="학습을 취소하시겠습니까?"
        description="현재 생성한 카드가 삭제될 수 있습니다."
        action="나가기"
        cancel="계속하기"
        onAction={handleBackConfirm}
        onCancel={handleBackCancel}
      />
      <AlertModal
        open={isMicAlertOpen}
        onOpenChange={handleMicAlertOpenChange}
        title="마이크 권한이 필요합니다."
        description="브라우저 설정에서 마이크 권한을 허용해주세요."
        action="확인"
        cancel="닫기"
        onAction={() => handleMicAlertOpenChange(false)}
        onCancel={() => handleMicAlertOpenChange(false)}
      />
    </div>
  )
}

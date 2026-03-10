'use client'
import { useRouter } from 'next/navigation'

import { ChallengeKeywordCard, useChallengeRecordController } from '@/features/challenge'
import { MicrophoneBox } from '@/features/record'
import { Button, ModeHeader, RecordTipBox } from '@/shared'

export function ChallengePage() {
  const router = useRouter()
  const {
    handleMicClick,
    handleRecordingComplete,
    getElapsedSeconds,
    isRecording,
    isPaused,
    recordedBlob,
    isSubmittingFeedback,
    canSubmitRecording,
  } = useChallengeRecordController()

  const handleBack = () => {
    router.back()
  }
  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <ModeHeader
        mode="challenge"
        step="waiting"
        onBack={handleBack}
      />
      <div className="flex h-full w-full flex-col items-center gap-4 py-4">
        <p className="text-center">키워드가 제시되었습니다!</p>
        <ChallengeKeywordCard
          variant="today"
          keyword="JWT"
        />
        <MicrophoneBox
          onMicClick={handleMicClick}
          title="음성으로 말해보세요."
          description={'키워드에 대해 생각하신 후, 준비가 되면 시작해주세요! 기회는 한 번입니다.'}
          errorMessage={''}
          isMicDisabled={Boolean(recordedBlob)}
          isRecording={isRecording}
          isPaused={isPaused}
          getElapsedSeconds={getElapsedSeconds}
        />
        <RecordTipBox />
        <div className="mt-auto">
          {true ? (
            <Button
              variant="record_confirm_btn"
              onClick={() => {
                void handleRecordingComplete()
              }}
              disabled={!isRecording || !canSubmitRecording || isSubmittingFeedback}
            >
              녹음 완료 및 제출하기
            </Button>
          ) : (
            <div className="border-primary flex min-h-12.5 min-w-87.5 items-center justify-center rounded-xl border text-center">
              <p>현재 챌린지에 76명이 도전 중입니다!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { MicrophoneBox } from '@/features/record'
import { Button, RecordTipBox, StatusLoader } from '@/shared'

import { PvPThinkingCountdown } from './PvPThinkingCountdown'

type PvPBattleSectionProps = {
  // 현재 대결 키워드명
  keywordName: string
  // THINKING 단계 여부
  isThinkingStep: boolean
  // THINKING 종료 시각(ms)
  thinkingEndsAtMs: number | null
  // 제출/처리/완료 상태면 로더를 렌더한다.
  shouldShowFeedbackLoader: boolean
  // 로더 상태 표기용 processing 여부
  isProcessingStep: boolean
  // 녹음 컨트롤러 상태
  isRecording: boolean
  isPaused: boolean
  elapsedSeconds: number
  isMicDisabled: boolean
  // 마이크/준비 버튼 액션
  onMicClick: () => void
  onReadyClick: () => void
  // 준비 버튼 활성 조건
  canStartPvPRecording: boolean
}

export function PvPBattleSection({
  keywordName,
  isThinkingStep,
  thinkingEndsAtMs,
  shouldShowFeedbackLoader,
  isProcessingStep,
  isRecording,
  isPaused,
  elapsedSeconds,
  isMicDisabled,
  onMicClick,
  onReadyClick,
  canStartPvPRecording,
}: PvPBattleSectionProps) {
  return (
    <>
      {/* 현재 대결 키워드를 보여준다. */}
      <p className="text-center text-base font-semibold">{keywordName}</p>
      {/* THINKING 단계일 때만 남은 생각 시간을 렌더한다. */}
      <PvPThinkingCountdown
        isThinkingStep={isThinkingStep}
        thinkingEndsAtMs={thinkingEndsAtMs}
      />
      {/* 제출/처리/완료 상태에서는 로더를 보여주고, 그 외에는 마이크 박스를 노출한다. */}
      {shouldShowFeedbackLoader ? (
        <StatusLoader status={isProcessingStep ? 'PROCESSING' : 'PENDING'} />
      ) : (
        <MicrophoneBox
          onMicClick={onMicClick}
          title="음성으로 말해보세요."
          description="버튼을 눌러 녹음을 시작하세요."
          errorMessage="녹음 시작에 실패했습니다."
          isMicDisabled={isMicDisabled}
          isRecording={isRecording}
          isPaused={isPaused}
          elapsedSeconds={elapsedSeconds}
        />
      )}
      {/* 녹음 가이드와 준비 버튼은 battle 영역 하단에 고정한다. */}
      <RecordTipBox />
      <div className="mb-6 flex w-full items-center justify-center">
        <Button
          variant="record_confirm_btn"
          onClick={onReadyClick}
          disabled={!canStartPvPRecording}
        >
          준비
        </Button>
      </div>
    </>
  )
}

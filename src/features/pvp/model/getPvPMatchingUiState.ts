import {
  FINISHED_ROOM_STATUS,
  OPEN_ROOM_STATUS,
  PROCESSING_ROOM_STATUS,
  RECORDING_ROOM_STATUS,
  THINKING_ROOM_STATUS,
} from './pvpMatchingConstants'

type GetPvPMatchingUiStateParams = {
  roomStatus: string | null
  hostUserId: number
  myUserId: number | undefined
  isSubmittingSubmission: boolean
  isSubmissionCompleted: boolean
}

type PvPMatchingUiState = {
  isRecordingStep: boolean
  isProcessingStep: boolean
  isThinkingStep: boolean
  isHostWaitingOpenState: boolean
  shouldRenderBattleUi: boolean
  isHeaderBackDisabled: boolean
  shouldShowFeedbackLoader: boolean
}

export function getPvPMatchingUiState({
  roomStatus,
  hostUserId,
  myUserId,
  isSubmittingSubmission,
  isSubmissionCompleted,
}: GetPvPMatchingUiStateParams): PvPMatchingUiState {
  const isRecordingStep = roomStatus === RECORDING_ROOM_STATUS
  const isProcessingStep = roomStatus === PROCESSING_ROOM_STATUS
  const isThinkingStep = roomStatus === THINKING_ROOM_STATUS
  const isHostWaitingOpenState = roomStatus === OPEN_ROOM_STATUS && hostUserId === myUserId
  const shouldRenderBattleUi = !isHostWaitingOpenState
  const isFinishedStep = roomStatus === FINISHED_ROOM_STATUS
  const isHeaderBackDisabled = isRecordingStep || isProcessingStep || isFinishedStep
  const shouldShowFeedbackLoader =
    isSubmittingSubmission || isSubmissionCompleted || isProcessingStep || isFinishedStep

  return {
    isRecordingStep,
    isProcessingStep,
    isThinkingStep,
    isHostWaitingOpenState,
    shouldRenderBattleUi,
    isHeaderBackDisabled,
    shouldShowFeedbackLoader,
  }
}

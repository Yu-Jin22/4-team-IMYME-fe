'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PvPCategory } from '@/entities/pvp-card'
import { useAccessToken } from '@/features/auth'
import {
  FINISHED_ROOM_STATUS,
  OPEN_ROOM_STATUS,
  PROCESSING_ROOM_STATUS,
  PVP_MATCHING_ACCESS_DENIED_MESSAGE,
  PVP_MATCHING_EMPTY_GUEST_NAME,
  PVP_MATCHING_ERROR_MESSAGE,
  PVP_MATCHING_INVALID_ROOM_ID_MESSAGE,
  PVP_MATCHING_LOADING_MESSAGE,
  PVP_MATCHING_PENDING_KEYWORD_MESSAGE,
  PVP_OPPONENT_SUBMITTED_TOAST_MESSAGE,
  PVP_START_RECORDING_ERROR_MESSAGE,
  PvPBattleSection,
  PvPMatchingWaiting,
  PvPParticipants,
  RECORDING_ROOM_STATUS,
  startPvPRecording,
  THINKING_ROOM_STATUS,
  usePvPMatchingAccess,
  usePvPMatchingExitGuard,
  usePvPMatchingRouting,
  usePvPMatchingSocket,
  usePvPRecordController,
} from '@/features/pvp'
import { AlertModal, ModeHeader, StatusMessage } from '@/shared'

export function PvPMatchingPage() {
  const params = useParams<{ id: string }>()
  const roomId = Number(params.id)
  const accessToken = useAccessToken()

  // 접근 검증/room join/participant 판별은 전용 훅으로 분리
  const {
    accessState,
    myUserId,
    resolvedRoomDetails,
    joinedRoomId,
    participantRoomId,
    shouldRedirectToRooms,
  } = usePvPMatchingAccess({
    accessToken,
    roomId,
  })

  // 준비(start-recording 요청) 진행 중 상태
  const [isStartingRecordingRequest, setIsStartingRecordingRequest] = useState(false)
  // 내가 준비 버튼을 이미 눌렀는지 여부
  const [isReadySubmitted, setIsReadySubmitted] = useState(false)

  // 매칭 소켓 구독 훅
  const {
    liveRoomStatus,
    thinkingKeywordName,
    thinkingEndsAtMs,
    setLiveRoomStatus,
    cleanupMatchingConnection,
  } = usePvPMatchingSocket({
    accessToken,
    joinedRoomId,
    // 메시지 발신자 판별용 현재 유저 id
    myUserId,
    // 내가 준비했을 때 local 상태 반영
    onSelfReady: () => {
      setIsReadySubmitted(true)
    },
    // 내가 제출 완료한 이벤트 수신 시 로더 상태 유지
    onSelfAnswerSubmitted: () => {
      markSubmissionCompleted()
    },
    // 상대 제출 완료 이벤트 수신 시(내가 아직 녹음중이면) 토스트 표시
    onOpponentAnswerSubmitted: () => {
      if (isRecording && !isSubmissionCompleted) {
        toast.info(PVP_OPPONENT_SUBMITTED_TOAST_MESSAGE)
      }
    },
  })

  // 페이지 이탈(뒤로가기/종료) 가드 훅
  const { isExitAlertOpen, handleBack, handleExitConfirm, handleExitCancel, setIsExitAlertOpen } =
    usePvPMatchingExitGuard({
      accessToken,
      joinedRoomId: participantRoomId,
      cleanupMatchingConnection,
    })

  // 실시간 status가 있으면 우선 사용, 없으면 초기 방 상태 사용
  const latestRoomStatus = liveRoomStatus ?? resolvedRoomDetails?.status ?? null

  const isFinishedStatus = latestRoomStatus === FINISHED_ROOM_STATUS

  const {
    isRecording,
    // 일시정지 여부(현재 PvP는 pause 비활성 설계지만 UI 호환으로 유지)
    isPaused,
    elapsedSeconds,
    recordedBlob,
    // 마이크 상호작용 허용 여부
    isMicInteractionAllowed,
    // 제출 API 처리 중 여부
    isSubmittingSubmission,
    // 제출 완료 상태(로더 유지용)
    isSubmissionCompleted,
    // self ANSWER_SUBMITTED 수신 시 완료 상태 동기화 함수
    markSubmissionCompleted,
    handlePvPMicClick,
  } = usePvPRecordController({
    accessToken,
    roomId: joinedRoomId,
    roomStatus: latestRoomStatus,
  })

  // 종료 상태 라우팅(main/feedback)과 에러 상태 방 목록 복귀는 전용 훅에서 처리
  usePvPMatchingRouting({
    latestRoomStatus,
    participantRoomId,
    roomId,
    shouldRedirectToRooms,
    cleanupMatchingConnection,
  })

  // accessState 하나로 페이지 초기 상태를 표준화해 렌더 분기를 단순화한다.
  if (accessState === 'invalid_room_id') {
    return <StatusMessage message={PVP_MATCHING_INVALID_ROOM_ID_MESSAGE} />
  }

  if (accessState === 'loading') {
    return <StatusMessage message={PVP_MATCHING_LOADING_MESSAGE} />
  }

  if (accessState === 'fetch_error' || accessState === 'join_error') {
    return <StatusMessage message={PVP_MATCHING_ERROR_MESSAGE} />
  }

  if (accessState === 'access_denied') {
    return <StatusMessage message={PVP_MATCHING_ACCESS_DENIED_MESSAGE} />
  }

  // 타입스크립트가 accessState만으로는 null 제거를 확정하지 못하므로 한 번 더 좁힌다.
  const roomDetails = resolvedRoomDetails
  if (!roomDetails) {
    return <StatusMessage message={PVP_MATCHING_ACCESS_DENIED_MESSAGE} />
  }

  // roomDetails는 이제 null이 아니므로 이후 UI 계산의 기준 객체로 사용한다.
  // UI 렌더 기준 room status (실시간 우선)
  const roomStatusForDisplay = liveRoomStatus ?? roomDetails.status
  const isRecordingStep = roomStatusForDisplay === RECORDING_ROOM_STATUS
  const isProcessingStep = roomStatusForDisplay === PROCESSING_ROOM_STATUS

  // 참가자 정보 매핑은 JSX에서 반복하지 않도록 상단에서 한 번만 만든다.
  const leftProfile = {
    name: roomDetails.host.nickname,
    avatarUrl: roomDetails.host.profileImageUrl,
  }
  const rightProfile = {
    name: roomDetails.guest?.nickname ?? PVP_MATCHING_EMPTY_GUEST_NAME,
    avatarUrl: roomDetails.guest?.profileImageUrl ?? '',
  }

  // OPEN + HOST 상태면 대기 화면(PvPMatchingWaiting) 렌더
  const isHostWaitingOpenState =
    roomStatusForDisplay === OPEN_ROOM_STATUS && roomDetails.host.id === myUserId
  const shouldRenderBattleUi = !isHostWaitingOpenState

  const isHeaderBackDisabled =
    roomStatusForDisplay === RECORDING_ROOM_STATUS ||
    roomStatusForDisplay === PROCESSING_ROOM_STATUS ||
    roomStatusForDisplay === FINISHED_ROOM_STATUS

  const keywordNameForDisplay =
    thinkingKeywordName ?? roomDetails.keyword?.name ?? PVP_MATCHING_PENDING_KEYWORD_MESSAGE
  const isThinkingStep = roomStatusForDisplay === THINKING_ROOM_STATUS

  const shouldShowFeedbackLoader =
    isSubmittingSubmission || isSubmissionCompleted || isProcessingStep || isFinishedStatus

  // 준비 버튼 활성 조건
  const canStartPvPRecording =
    isThinkingStep &&
    Boolean(accessToken) &&
    Boolean(joinedRoomId) &&
    !isStartingRecordingRequest &&
    !isReadySubmitted

  // THINKING 단계에서 준비 버튼을 누르면 서버에 RECORDING 전환을 요청
  const handleReadyButtonClick = async () => {
    if (!accessToken || !joinedRoomId) return
    if (isReadySubmitted || isStartingRecordingRequest) return

    // 중복 클릭 방지 상태 on
    setIsReadySubmitted(true)
    setIsStartingRecordingRequest(true)
    // 서버에 RECORDING 시작 요청
    const startRecordingResult = await startPvPRecording(accessToken, joinedRoomId)
    // 요청 종료
    setIsStartingRecordingRequest(false)

    if (!startRecordingResult.ok) {
      setIsReadySubmitted(false)
      toast.error(PVP_START_RECORDING_ERROR_MESSAGE)
      return
    }

    // 성공 시 응답 status를 즉시 UI 상태에 반영
    setLiveRoomStatus(startRecordingResult.data.status)
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <ModeHeader
        mode="pvp"
        step={isRecordingStep ? 'recording' : 'battle'}
        onBack={handleBack}
        backDisabled={isHeaderBackDisabled}
      />
      <PvPCategory categoryName={roomDetails.category.name} />
      {isHostWaitingOpenState ? (
        <PvPMatchingWaiting
          leftProfile={leftProfile}
          rightProfile={rightProfile}
        />
      ) : (
        <PvPParticipants
          leftProfile={leftProfile}
          rightProfile={rightProfile}
        />
      )}
      {shouldRenderBattleUi ? (
        <PvPBattleSection
          keywordName={keywordNameForDisplay}
          isThinkingStep={isThinkingStep}
          thinkingEndsAtMs={thinkingEndsAtMs}
          shouldShowFeedbackLoader={shouldShowFeedbackLoader}
          isProcessingStep={isProcessingStep}
          isRecording={isRecording}
          isPaused={isPaused}
          elapsedSeconds={elapsedSeconds}
          isMicDisabled={Boolean(recordedBlob) || !isMicInteractionAllowed}
          onMicClick={() => {
            void handlePvPMicClick()
          }}
          onReadyClick={() => {
            void handleReadyButtonClick()
          }}
          canStartPvPRecording={canStartPvPRecording}
        />
      ) : null}
      <AlertModal
        open={isExitAlertOpen}
        onOpenChange={setIsExitAlertOpen}
        title="매칭을 나가시겠습니까?"
        description="진행 중이던 매칭이 취소됩니다."
        action="나가기"
        cancel="닫기"
        onAction={() => {
          void handleExitConfirm()
        }}
        onCancel={handleExitCancel}
      />
    </div>
  )
}

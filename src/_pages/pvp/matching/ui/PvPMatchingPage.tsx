'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { PvPCategory } from '@/entities/pvp-card'
import { useEnsuredAccessToken } from '@/features/auth'
import {
  getPvPMatchingUiState,
  MATCHED_ROOM_STATUS,
  OPEN_ROOM_STATUS,
  PVP_MATCHING_ACCESS_DENIED_MESSAGE,
  PVP_MATCHING_ERROR_MESSAGE,
  PVP_MATCHING_INVALID_ROOM_ID_MESSAGE,
  PVP_MATCHING_LOADING_MESSAGE,
  PVP_MATCHING_PENDING_KEYWORD_MESSAGE,
  PVP_OPPONENT_SUBMITTED_TOAST_MESSAGE,
  PvPBattleSection,
  PvPMatchingWaiting,
  PvPParticipants,
  usePvPMatchingAccess,
  usePvPMatchingExitGuard,
  usePvPMatchingRouting,
  usePvPReadyAction,
  usePvPMatchingSocket,
  usePvPRecordController,
  toPvPParticipantProfiles,
} from '@/features/pvp'
import { AlertModal, ModeHeader, StatusMessage } from '@/shared'

export function PvPMatchingPage() {
  const params = useParams<{ id: string }>()
  const roomId = Number(params.id)
  const socketAccessToken = useEnsuredAccessToken(Boolean(roomId))

  // 내가 준비 버튼을 이미 눌렀는지 여부
  const [isReadySubmitted, setIsReadySubmitted] = useState(false)

  function handleSelfReadyMessage() {
    setIsReadySubmitted(true)
  }

  function handleSelfAnswerSubmittedMessage() {
    markSubmissionCompleted()
  }

  function handleOpponentAnswerSubmittedMessage() {
    if (isRecording && !isSubmissionCompleted) {
      toast.info(PVP_OPPONENT_SUBMITTED_TOAST_MESSAGE)
    }
  }

  // 접근 검증/room join/participant 판별은 전용 훅으로 분리
  const {
    accessState,
    myUserId,
    resolvedRoomDetails,
    joinedRoomId,
    participantRoomId,
    shouldRedirectToRooms,
    refetchRoomDetails,
  } = usePvPMatchingAccess({
    roomId,
  })
  const hasRefetchedMatchedRoomRef = useRef(false)

  // 매칭 소켓 구독 훅
  const {
    liveRoomStatus,
    thinkingKeywordName,
    thinkingEndsAtMs,
    setLiveRoomStatus,
    resetBattleKeywordDisplay,
    unregisterRoomSession,
    cleanupMatchingConnection,
  } = usePvPMatchingSocket({
    accessToken: socketAccessToken,
    joinedRoomId,
    // 메시지 발신자 판별용 현재 유저 id
    myUserId,
    // 내가 준비했을 때 local 상태 반영
    onSelfReady: handleSelfReadyMessage,
    // 내가 제출 완료한 이벤트 수신 시 로더 상태 유지
    onSelfAnswerSubmitted: handleSelfAnswerSubmittedMessage,
    // 상대 제출 완료 이벤트 수신 시(내가 아직 녹음중이면) 토스트 표시
    onOpponentAnswerSubmitted: handleOpponentAnswerSubmittedMessage,
  })

  // 소켓 상태가 있으면 우선 사용하고, 없으면 서버 초기 상태를 현재 상태로 사용한다.
  const currentRoomStatus = liveRoomStatus ?? resolvedRoomDetails?.status ?? null

  // ROOM_JOINED payload에는 guest 프로필 이미지가 없으므로,
  // MATCHED 진입 시 방 상세를 다시 읽어 호스트 화면의 guest 프로필을 동기화한다.
  useEffect(() => {
    if (currentRoomStatus !== MATCHED_ROOM_STATUS) {
      hasRefetchedMatchedRoomRef.current = false
      return
    }

    if (hasRefetchedMatchedRoomRef.current) return

    hasRefetchedMatchedRoomRef.current = true
    void refetchRoomDetails()
  }, [currentRoomStatus, refetchRoomDetails])

  // 준비 버튼 클릭 액션
  const { canStartPvPRecording, handleReadyButtonClick } = usePvPReadyAction({
    roomId: joinedRoomId,
    roomStatus: currentRoomStatus,
    isReadySubmitted,
    setIsReadySubmitted,
    onReadySuccess: setLiveRoomStatus,
  })

  // 페이지 이탈(뒤로가기/종료) 가드 훅
  const { isExitAlertOpen, handleBack, handleExitConfirm, handleExitCancel, setIsExitAlertOpen } =
    usePvPMatchingExitGuard({
      joinedRoomId: participantRoomId,
      unregisterRoomSession,
      cleanupMatchingConnection,
    })

  const {
    isRecording,
    // 일시정지 여부(현재 PvP는 pause 비활성 설계지만 UI 호환으로 유지)
    isPaused,
    getElapsedSeconds,
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
    roomId: joinedRoomId,
    roomStatus: currentRoomStatus,
  })

  // 종료 상태 라우팅(main/feedback)과 에러 상태 라우팅
  usePvPMatchingRouting({
    latestRoomStatus: currentRoomStatus,
    participantRoomId,
    roomId,
    shouldRedirectToRooms,
    cleanupMatchingConnection,
  })

  // 호스트 OPEN 대기 화면(PvPMatchingWaiting)으로 전환되면
  // 이전 battle 섹션에서 보던 키워드 표시 상태를 초기화한다.
  const shouldResetBattleKeywordOnWaiting =
    accessState === 'ready' &&
    Boolean(resolvedRoomDetails) &&
    (liveRoomStatus ?? resolvedRoomDetails?.status) === OPEN_ROOM_STATUS &&
    resolvedRoomDetails?.host.id === myUserId

  useEffect(() => {
    if (!shouldResetBattleKeywordOnWaiting) return
    resetBattleKeywordDisplay()
  }, [resetBattleKeywordDisplay, shouldResetBattleKeywordOnWaiting])

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

  // 화면 표시용 상태도 소켓 상태를 우선 사용하되, 없으면 서버 상태를 그대로 보여준다.
  const displayRoomStatus = liveRoomStatus ?? roomDetails.status

  // 참가자 표시용 프로필 shape 변환은 helper에 맡긴다.
  const { leftProfile, rightProfile } = toPvPParticipantProfiles(roomDetails)

  const keywordNameForDisplay =
    thinkingKeywordName ?? roomDetails.keyword?.name ?? PVP_MATCHING_PENDING_KEYWORD_MESSAGE

  // status 기반 화면 파생값은 순수 함수에서 한 번에 계산한다.
  const {
    isRecordingStep,
    isProcessingStep,
    isThinkingStep,
    isHeaderBackDisabled,
    isHostWaitingOpenState,
    shouldRenderBattleUi,
    shouldShowFeedbackLoader,
  } = getPvPMatchingUiState({
    roomStatus: displayRoomStatus,
    hostUserId: roomDetails.host.id,
    myUserId,
    isSubmittingSubmission,
    isSubmissionCompleted,
  })

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
        <PvPMatchingWaiting leftProfile={leftProfile} />
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
          getElapsedSeconds={getElapsedSeconds}
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

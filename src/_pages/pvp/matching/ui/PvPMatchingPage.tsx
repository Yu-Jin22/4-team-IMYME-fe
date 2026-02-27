'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { PvPCategory, PvPKeyword } from '@/entities/pvp-card'
import { usePvPRoomDetails } from '@/entities/room'
import { useMyProfileQuery, useUserId } from '@/entities/user'
import { useAccessToken } from '@/features/auth'
import { FeedbackLoader } from '@/features/levelup-feedback'
import {
  usePvPMatchingExitGuard,
  PvPMatchingWaiting,
  PvPParticipants,
  PvPThinkingCountdown,
  startPvPRecording,
  usePvPMatchingSocket,
  usePvPRecordController,
  usePvPRoomJoinQuery,
} from '@/features/pvp'
import { MicrophoneBox } from '@/features/record'
import { AlertModal, Button, ModeHeader, RecordTipBox, StatusMessage } from '@/shared'

const ERROR_MESSAGE = '매칭 방에 입장하지 못했습니다.'
const ROOM_ACCESS_DENIED_MESSAGE = '참여 중인 매칭 방이 아닙니다.'
const INVALID_ROOM_ID_MESSAGE = '잘못된 방 정보입니다.'
const LOADING_MESSAGE = '매칭 방 정보를 불러오는 중입니다.'
const EMPTY_GUEST_NAME = '...'

const OPEN_ROOM_STATUS = 'OPEN'
const THINKING_ROOM_STATUS = 'THINKING'
const RECORDING_ROOM_STATUS = 'RECORDING'
const PROCESSING_ROOM_STATUS = 'PROCESSING'
const FINISHED_ROOM_STATUS = 'FINISHED'

const START_RECORDING_ERROR_MESSAGE = '녹음 시작 요청에 실패했습니다. 다시 시도해주세요.'
const OPPONENT_SUBMITTED_TOAST_MESSAGE = '상대방이 음성 제출을 완료했습니다.'
const PVP_FEEDBACK_PATH_PREFIX = '/pvp/feedback'

export function PvPMatchingPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const roomId = Number(params.id)
  const isInvalidRoomId = Number.isNaN(roomId)

  const accessToken = useAccessToken()
  const storeUserId = useUserId()

  const shouldFetchMyProfile = Boolean(accessToken) && storeUserId <= 0
  const myProfileQuery = useMyProfileQuery(accessToken, { enabled: shouldFetchMyProfile })
  const myUserId = storeUserId > 0 ? storeUserId : myProfileQuery.data?.id
  const hasMyUserId = typeof myUserId === 'number' && myUserId > 0

  const roomDetailsQuery = usePvPRoomDetails(accessToken, roomId, {
    enabled: !isInvalidRoomId,
  })
  const roomDetailsFromServer = roomDetailsQuery.data

  const isHostUser = hasMyUserId && roomDetailsFromServer?.host.id === myUserId
  const isGuestUser = hasMyUserId && roomDetailsFromServer?.guest?.id === myUserId

  let shouldAttemptJoinRoom = false
  if (accessToken && hasMyUserId && roomDetailsFromServer && !isHostUser && !isGuestUser) {
    shouldAttemptJoinRoom =
      roomDetailsFromServer.status === OPEN_ROOM_STATUS && roomDetailsFromServer.guest === null
  }

  const roomJoinQuery = usePvPRoomJoinQuery(accessToken, roomId, {
    enabled: shouldAttemptJoinRoom,
  })
  const joinedRoomDetails = roomJoinQuery.data?.ok ? roomJoinQuery.data.data : null
  const resolvedRoomDetails = joinedRoomDetails ?? roomDetailsFromServer ?? null
  const joinedRoomId = resolvedRoomDetails?.room.id ?? null
  const socketRoomId = joinedRoomId

  let isParticipantUser = false
  if (hasMyUserId && resolvedRoomDetails) {
    isParticipantUser =
      resolvedRoomDetails.host.id === myUserId || resolvedRoomDetails.guest?.id === myUserId
  }
  const participantRoomId = isParticipantUser ? joinedRoomId : null

  const isProfileLoading = shouldFetchMyProfile && myProfileQuery.isLoading
  const isRoomLoading = roomDetailsQuery.isLoading
  const isJoinLoading = shouldAttemptJoinRoom && roomJoinQuery.isLoading

  const [isStartingRecordingRequest, setIsStartingRecordingRequest] = useState(false)
  const [isReadySubmitted, setIsReadySubmitted] = useState(false)
  const hasRoutedToFeedbackRef = useRef(false)

  const {
    liveRoomStatus,
    thinkingKeywordName,
    thinkingEndsAtMs,
    setLiveRoomStatus,
    cleanupMatchingConnection,
  } = usePvPMatchingSocket({
    accessToken,
    joinedRoomId: socketRoomId,
    myUserId,
    onSelfReady: () => {
      setIsReadySubmitted(true)
    },
    onSelfAnswerSubmitted: () => {
      markSubmissionCompleted()
    },
    onOpponentAnswerSubmitted: () => {
      if (isRecording && !isSubmissionCompleted) {
        toast.info(OPPONENT_SUBMITTED_TOAST_MESSAGE)
      }
    },
  })

  const { isExitAlertOpen, handleBack, handleExitConfirm, handleExitCancel, setIsExitAlertOpen } =
    usePvPMatchingExitGuard({
      accessToken,
      joinedRoomId: participantRoomId,
      cleanupMatchingConnection,
    })

  const latestRoomStatus = liveRoomStatus ?? resolvedRoomDetails?.status ?? null
  const isFinishedStatus = latestRoomStatus === FINISHED_ROOM_STATUS

  const {
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlob,
    isMicInteractionAllowed,
    isSubmittingSubmission,
    isSubmissionCompleted,
    markSubmissionCompleted,
    handlePvPMicClick,
  } = usePvPRecordController({
    accessToken,
    roomId: socketRoomId,
    roomStatus: latestRoomStatus,
  })

  useEffect(() => {
    if (!isFinishedStatus) return
    if (hasRoutedToFeedbackRef.current) return

    const targetRoomId = participantRoomId ?? roomId
    if (!targetRoomId || Number.isNaN(targetRoomId)) return

    hasRoutedToFeedbackRef.current = true

    const moveToFeedbackPage = async () => {
      await cleanupMatchingConnection()
      router.replace(`${PVP_FEEDBACK_PATH_PREFIX}/${targetRoomId}`)
    }

    void moveToFeedbackPage()
  }, [cleanupMatchingConnection, isFinishedStatus, participantRoomId, roomId, router])

  if (isInvalidRoomId) {
    return <StatusMessage message={INVALID_ROOM_ID_MESSAGE} />
  }

  if (isProfileLoading || isRoomLoading || isJoinLoading) {
    return <StatusMessage message={LOADING_MESSAGE} />
  }

  if (roomDetailsQuery.isError || !roomDetailsFromServer) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  if (shouldAttemptJoinRoom && (roomJoinQuery.isError || roomJoinQuery.data?.ok === false)) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  if (!resolvedRoomDetails || !isParticipantUser) {
    return <StatusMessage message={ROOM_ACCESS_DENIED_MESSAGE} />
  }

  const roomStatusForDisplay = liveRoomStatus ?? resolvedRoomDetails.status
  const isRecordingStep = roomStatusForDisplay === RECORDING_ROOM_STATUS
  const isProcessingStep = roomStatusForDisplay === PROCESSING_ROOM_STATUS
  const isHostWaitingOpenState =
    roomStatusForDisplay === OPEN_ROOM_STATUS && resolvedRoomDetails.host.id === myUserId
  const shouldRenderBattleUi = !isHostWaitingOpenState
  const isHeaderBackDisabled =
    roomStatusForDisplay === RECORDING_ROOM_STATUS ||
    roomStatusForDisplay === PROCESSING_ROOM_STATUS ||
    roomStatusForDisplay === FINISHED_ROOM_STATUS

  const keywordNameForDisplay = thinkingKeywordName ?? resolvedRoomDetails.keyword?.name ?? ''
  const isThinkingStep = roomStatusForDisplay === THINKING_ROOM_STATUS
  const shouldShowFeedbackLoader =
    isSubmittingSubmission || isSubmissionCompleted || isProcessingStep || isFinishedStatus

  const canStartPvPRecording =
    isThinkingStep &&
    Boolean(accessToken) &&
    Boolean(socketRoomId) &&
    !isStartingRecordingRequest &&
    !isReadySubmitted

  const handleReadyButtonClick = async () => {
    if (!accessToken || !socketRoomId) return
    if (isReadySubmitted || isStartingRecordingRequest) return

    setIsReadySubmitted(true)
    setIsStartingRecordingRequest(true)
    const startRecordingResult = await startPvPRecording(accessToken, socketRoomId)
    setIsStartingRecordingRequest(false)

    if (!startRecordingResult.ok) {
      setIsReadySubmitted(false)
      toast.error(START_RECORDING_ERROR_MESSAGE)
      return
    }

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
      <PvPCategory categoryName={resolvedRoomDetails.category.name} />
      {isHostWaitingOpenState ? (
        <PvPMatchingWaiting
          leftProfile={{
            name: resolvedRoomDetails.host.nickname,
            avatarUrl: resolvedRoomDetails.host.profileImageUrl,
          }}
          rightProfile={{
            name: resolvedRoomDetails.guest?.nickname ?? EMPTY_GUEST_NAME,
            avatarUrl: resolvedRoomDetails.guest?.profileImageUrl ?? '',
          }}
        />
      ) : (
        <PvPParticipants
          leftProfile={{
            name: resolvedRoomDetails.host.nickname,
            avatarUrl: resolvedRoomDetails.host.profileImageUrl,
          }}
          rightProfile={{
            name: resolvedRoomDetails.guest?.nickname ?? EMPTY_GUEST_NAME,
            avatarUrl: resolvedRoomDetails.guest?.profileImageUrl ?? '',
          }}
        />
      )}
      {shouldRenderBattleUi ? (
        <>
          <PvPKeyword keywordName={keywordNameForDisplay} />
          <PvPThinkingCountdown
            isThinkingStep={isThinkingStep}
            thinkingEndsAtMs={thinkingEndsAtMs}
          />
          {shouldShowFeedbackLoader ? (
            <FeedbackLoader status={isProcessingStep ? 'PROCESSING' : 'PENDING'} />
          ) : (
            <MicrophoneBox
              onMicClick={() => {
                void handlePvPMicClick()
              }}
              title="음성으로 말해보세요."
              description="버튼을 눌러 녹음을 시작하세요."
              errorMessage="녹음 시작에 실패했습니다."
              isMicDisabled={Boolean(recordedBlob) || !isMicInteractionAllowed}
              isRecording={isRecording}
              isPaused={isPaused}
              elapsedSeconds={elapsedSeconds}
            />
          )}
          <RecordTipBox />
          <div className="mb-6 flex w-full items-center justify-center">
            <Button
              variant="record_confirm_btn"
              onClick={() => {
                void handleReadyButtonClick()
              }}
              disabled={!canStartPvPRecording}
            >
              준비
            </Button>
          </div>
        </>
      ) : null}
      <AlertModal
        open={isExitAlertOpen}
        onOpenChange={setIsExitAlertOpen}
        title="매칭을 종료하시겠습니까?"
        description="진행 중인 매칭을 종료합니다."
        action="종료"
        cancel="닫기"
        onAction={() => {
          void handleExitConfirm()
        }}
        onCancel={handleExitCancel}
      />
    </div>
  )
}

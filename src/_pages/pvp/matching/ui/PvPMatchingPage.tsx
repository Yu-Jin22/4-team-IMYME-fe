'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { PvPCategory, PvPKeyword } from '@/entities/pvp-card'
import { useMyProfileQuery, useUserId } from '@/entities/user'
import { useAccessToken } from '@/features/auth'
import { FeedbackLoader } from '@/features/levelup-feedback'
import {
  usePvPMatchingExitGuard,
  PvPParticipants,
  PvPThinkingCountdown,
  // 준비 버튼 클릭 시 RECORDING 시작 요청 API
  startPvPRecording,
  // 매칭 페이지 실시간 소켓 메시지 처리 훅
  usePvPMatchingSocket,
  // PvP 녹음 제어 훅
  usePvPRecordController,
  // RoomList에서 join해둔 결과를 캐시로 읽는 쿼리 훅
  usePvPRoomJoinQuery,
} from '@/features/pvp'
import { MicrophoneBox } from '@/features/record'
import { AlertModal, Button, ModeHeader, RecordTipBox, StatusMessage } from '@/shared'

const ERROR_MESSAGE = '매칭 방에 입장하지 못했습니다.'
const INVALID_ROOM_ID_MESSAGE = '잘못된 방 정보입니다.'
const EMPTY_GUEST_NAME = '...'
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

  // 준비 요청(start-recording) 중복 호출 방지 state
  const [isStartingRecordingRequest, setIsStartingRecordingRequest] = useState(false)
  // 내가 준비 버튼을 눌렀는지 state (중복 클릭/중복 요청 방지)
  const [isReadySubmitted, setIsReadySubmitted] = useState(false)

  // RoomList에서 join 결과를 캐시에 넣어주므로 매칭 페이지에서는 캐시만 읽는다.
  // enabled:false로 네트워크 재호출 없이 캐시 데이터만 조회한다.
  const roomJoinQuery = usePvPRoomJoinQuery(accessToken, roomId, { enabled: false })
  // 쿼리 성공 시 실제 room 상세 데이터만 꺼낸다.
  const joinedRoomDetails = roomJoinQuery.data?.ok ? roomJoinQuery.data.data : null
  const joinedRoomId = joinedRoomDetails?.room.id ?? null
  const hasRoutedToFeedbackRef = useRef(false)

  // 매칭 페이지 실시간 소켓 상태를 구독
  const {
    // 서버 브로드캐스트 기반의 실시간 방 상태
    liveRoomStatus,
    thinkingKeywordName,
    thinkingEndsAtMs,
    setLiveRoomStatus,
    cleanupMatchingConnection,
  } = usePvPMatchingSocket({
    accessToken,
    joinedRoomId,
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
  const latestRoomStatus = liveRoomStatus ?? joinedRoomDetails?.status ?? null
  const isFinishedStatus = latestRoomStatus === FINISHED_ROOM_STATUS

  // 녹음 컨트롤러가 참고할 상태: 실시간 상태 우선, 없으면 초기 room 상태
  const roomStatusForController = latestRoomStatus

  const { isExitAlertOpen, handleBack, handleExitConfirm, handleExitCancel, setIsExitAlertOpen } =
    usePvPMatchingExitGuard({
      accessToken,
      joinedRoomId,
      cleanupMatchingConnection,
    })

  const {
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlob,
    // 현재 단계/상태에서 마이크 클릭 가능한지
    isMicInteractionAllowed,
    isSubmittingSubmission,
    isSubmissionCompleted,
    markSubmissionCompleted,
    handlePvPMicClick,
  } = usePvPRecordController({
    accessToken,
    roomId: joinedRoomId ?? null,
    roomStatus: roomStatusForController,
  })

  useEffect(() => {
    if (!isFinishedStatus) return
    if (hasRoutedToFeedbackRef.current) return

    const targetRoomId = joinedRoomId ?? roomId
    if (!targetRoomId || Number.isNaN(targetRoomId)) return

    hasRoutedToFeedbackRef.current = true

    const moveToFeedbackPage = async () => {
      await cleanupMatchingConnection()
      router.replace(`${PVP_FEEDBACK_PATH_PREFIX}/${targetRoomId}`)
    }

    void moveToFeedbackPage()
  }, [cleanupMatchingConnection, isFinishedStatus, joinedRoomId, roomId, router])

  if (isInvalidRoomId) {
    return <StatusMessage message={INVALID_ROOM_ID_MESSAGE} />
  }

  // join 캐시가 없거나 에러면 매칭 페이지를 진행할 수 없으므로 에러 메시지 렌더
  if (roomJoinQuery.isError || roomJoinQuery.data?.ok === false || !roomJoinQuery.data) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  const roomDetails = roomJoinQuery.data.data

  // UI 표시용 상태: 실시간 상태 우선, 없으면 초기 상태
  const roomStatusForDisplay = liveRoomStatus ?? roomDetails.status
  // 헤더 step/녹음 단계 판별
  const isRecordingStep = roomStatusForDisplay === RECORDING_ROOM_STATUS
  const isProcessingStep = roomStatusForDisplay === PROCESSING_ROOM_STATUS
  const isHeaderBackDisabled =
    roomStatusForDisplay === RECORDING_ROOM_STATUS ||
    roomStatusForDisplay === PROCESSING_ROOM_STATUS ||
    roomStatusForDisplay === FINISHED_ROOM_STATUS

  const keywordNameForDisplay = thinkingKeywordName ?? roomDetails.keyword?.name ?? ''
  const isThinkingStep = roomStatusForDisplay === THINKING_ROOM_STATUS
  const shouldShowFeedbackLoader =
    isSubmittingSubmission || isSubmissionCompleted || isProcessingStep || isFinishedStatus

  // 준비 버튼 활성 조건:
  // THINKING 상태 + 토큰/roomId 존재 + start-recording 요청 중 아님 + 아직 준비 누르지 않음
  const canStartPvPRecording =
    isThinkingStep &&
    Boolean(accessToken) &&
    Boolean(joinedRoomId) &&
    !isStartingRecordingRequest &&
    !isReadySubmitted

  // 준비 버튼 클릭 핸들러
  const handleReadyButtonClick = async () => {
    if (!accessToken || !joinedRoomId) return
    if (isReadySubmitted || isStartingRecordingRequest) return

    setIsReadySubmitted(true)
    setIsStartingRecordingRequest(true)
    // 서버에 RECORDING 시작 요청
    const startRecordingResult = await startPvPRecording(accessToken, joinedRoomId)
    // 요청 종료 후 로딩 해제
    setIsStartingRecordingRequest(false)

    // 실패하면 제출 상태를 롤백하고 에러 토스트 표시
    if (!startRecordingResult.ok) {
      setIsReadySubmitted(false)
      toast.error(START_RECORDING_ERROR_MESSAGE)
      return
    }

    // 성공 시 서버 응답 status를 즉시 반영해 UI 지연을 줄인다.
    setLiveRoomStatus(startRecordingResult.data.status)
  }

  // 매칭 페이지 UI 렌더
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <ModeHeader
        mode="pvp"
        step={isRecordingStep ? 'recording' : 'battle'}
        onBack={handleBack}
        backDisabled={isHeaderBackDisabled}
      />
      <PvPCategory categoryName={roomDetails.category.name} />
      <PvPParticipants
        leftProfile={{
          name: roomDetails.host.nickname,
          avatarUrl: roomDetails.host.profileImageUrl,
        }}
        rightProfile={{
          name: roomDetails.guest?.nickname ?? EMPTY_GUEST_NAME,
          avatarUrl: roomDetails.guest?.profileImageUrl ?? '',
        }}
      />
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

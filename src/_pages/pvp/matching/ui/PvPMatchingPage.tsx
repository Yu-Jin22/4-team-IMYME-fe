'use client'

// 라우트 파라미터 조회/페이지 이동 훅
import { useParams, useRouter } from 'next/navigation'
// React 훅: 생명주기(effect), 재렌더 없이 값 유지(ref), 로컬 상태(state)
import { useEffect, useRef, useState } from 'react'
// 토스트 알림
import { toast } from 'sonner'

// 카테고리/키워드 표시 UI
import { PvPCategory, PvPKeyword } from '@/entities/pvp-card'
// 방 상세 조회 훅
import { usePvPRoomDetails } from '@/entities/room'
// 유저 프로필/유저 ID 조회 훅
import { useMyProfileQuery, useUserId } from '@/entities/user'
// access token 조회 훅
import { useAccessToken } from '@/features/auth'
// 제출/처리 중 로더 UI
import { FeedbackLoader } from '@/features/levelup-feedback'
// PvP 매칭 페이지에 필요한 기능/컴포넌트/훅 묶음 import
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
// 마이크 UI
import { MicrophoneBox } from '@/features/record'
// 공통 UI 컴포넌트
import { AlertModal, Button, ModeHeader, RecordTipBox, StatusMessage } from '@/shared'

// 공통 메시지 상수
const ERROR_MESSAGE = '매칭 방에 입장하지 못했습니다.'
const ROOM_ACCESS_DENIED_MESSAGE = '참여 중인 매칭 방이 아닙니다.'
const INVALID_ROOM_ID_MESSAGE = '잘못된 방 정보입니다.'
const LOADING_MESSAGE = '매칭 방 정보를 불러오는 중입니다.'
const EMPTY_GUEST_NAME = '...'

// 방 상태 상수
const OPEN_ROOM_STATUS = 'OPEN'
const THINKING_ROOM_STATUS = 'THINKING'
const RECORDING_ROOM_STATUS = 'RECORDING'
const PROCESSING_ROOM_STATUS = 'PROCESSING'
const FINISHED_ROOM_STATUS = 'FINISHED'
const CANCELED_ROOM_STATUS = 'CANCELED'
const EXPIRED_ROOM_STATUS = 'EXPIRED'

// 녹음 시작 실패 토스트 메시지
const START_RECORDING_ERROR_MESSAGE = '녹음 시작 요청에 실패했습니다. 다시 시도해주세요.'
// 상대 제출 완료 토스트 메시지
const OPPONENT_SUBMITTED_TOAST_MESSAGE = '상대방이 음성 제출을 완료했습니다.'
// 피드백 페이지 라우팅 prefix
const PVP_FEEDBACK_PATH_PREFIX = '/pvp/feedback'
const MAIN_PAGE_PATH = '/main'

export function PvPMatchingPage() {
  // 페이지 라우팅 객체
  const router = useRouter()
  // 동적 라우트 파라미터(id) 조회
  const params = useParams<{ id: string }>()
  // URL의 방 id를 숫자로 변환
  const roomId = Number(params.id)
  // 숫자 변환 실패 여부
  const isInvalidRoomId = Number.isNaN(roomId)

  // 현재 access token
  const accessToken = useAccessToken()
  // store에 저장된 현재 사용자 id
  const storeUserId = useUserId()

  // store userId가 없으면 myProfile 쿼리로 보완 조회
  const shouldFetchMyProfile = Boolean(accessToken) && storeUserId <= 0
  // 내 프로필 조회 쿼리
  const myProfileQuery = useMyProfileQuery(accessToken, { enabled: shouldFetchMyProfile })
  // 최종 사용자 id(store 우선, 없으면 query data)
  const myUserId = storeUserId > 0 ? storeUserId : myProfileQuery.data?.id
  // 사용자 id 유효 여부
  const hasMyUserId = typeof myUserId === 'number' && myUserId > 0

  // 방 상세 조회(진입 시 기본 정보 확보)
  const roomDetailsQuery = usePvPRoomDetails(accessToken, roomId, {
    enabled: !isInvalidRoomId,
  })
  // 서버에서 받은 방 상세 데이터
  const roomDetailsFromServer = roomDetailsQuery.data

  // 현재 유저가 host인지
  const isHostUser = hasMyUserId && roomDetailsFromServer?.host.id === myUserId
  // 현재 유저가 guest인지
  const isGuestUser = hasMyUserId && roomDetailsFromServer?.guest?.id === myUserId

  // 참가자가 아닌 경우에만 join API 시도 여부를 계산한다.
  let shouldAttemptJoinRoom = false
  if (accessToken && hasMyUserId && roomDetailsFromServer && !isHostUser && !isGuestUser) {
    shouldAttemptJoinRoom =
      roomDetailsFromServer.status === OPEN_ROOM_STATUS && roomDetailsFromServer.guest === null
  }

  // guest로 들어오는 경우 join API를 호출한다.
  const roomJoinQuery = usePvPRoomJoinQuery(accessToken, roomId, {
    enabled: shouldAttemptJoinRoom,
  })
  // join 성공 시 방 상세는 join 응답을 우선 사용
  const joinedRoomDetails = roomJoinQuery.data?.ok ? roomJoinQuery.data.data : null
  // join 결과가 없으면 기존 room details를 fallback으로 사용
  const resolvedRoomDetails = joinedRoomDetails ?? roomDetailsFromServer ?? null
  // 실제 사용할 room id
  const joinedRoomId = resolvedRoomDetails?.room.id ?? null
  // 소켓/녹음 컨트롤러에서 사용할 room id
  const socketRoomId = joinedRoomId

  // 현재 유저가 이 방의 실제 참가자인지 계산
  let isParticipantUser = false
  if (hasMyUserId && resolvedRoomDetails) {
    isParticipantUser =
      resolvedRoomDetails.host.id === myUserId || resolvedRoomDetails.guest?.id === myUserId
  }
  // 참가자가 맞을 때만 participant room id를 노출한다.
  const participantRoomId = isParticipantUser ? joinedRoomId : null

  // 프로필 조회 로딩 여부
  const isProfileLoading = shouldFetchMyProfile && myProfileQuery.isLoading
  // 방 조회 로딩 여부
  const isRoomLoading = roomDetailsQuery.isLoading
  // join API 로딩 여부
  const isJoinLoading = shouldAttemptJoinRoom && roomJoinQuery.isLoading

  // 준비(start-recording 요청) 진행 중 상태
  const [isStartingRecordingRequest, setIsStartingRecordingRequest] = useState(false)
  // 내가 준비 버튼을 이미 눌렀는지 여부
  const [isReadySubmitted, setIsReadySubmitted] = useState(false)
  // FINISHED 라우팅 중복 방지 ref
  const hasRoutedToFeedbackRef = useRef(false)
  // 취소/만료 라우팅 중복 방지 ref
  const hasRoutedToMainRef = useRef(false)

  // 매칭 소켓 구독 훅
  const {
    // 실시간 room status
    liveRoomStatus,
    // THINKING에서 내려오는 키워드명
    thinkingKeywordName,
    // THINKING 종료 시각(ms)
    thinkingEndsAtMs,
    // 상태를 수동으로 덮어쓰기 위한 setter
    setLiveRoomStatus,
    // 소켓 연결/구독 정리 함수
    cleanupMatchingConnection,
  } = usePvPMatchingSocket({
    // 토큰이 있어야 소켓 연결 가능
    accessToken,
    // 구독할 room id
    joinedRoomId: socketRoomId,
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
        toast.info(OPPONENT_SUBMITTED_TOAST_MESSAGE)
      }
    },
  })

  // 페이지 이탈(뒤로가기/종료) 가드 훅
  const { isExitAlertOpen, handleBack, handleExitConfirm, handleExitCancel, setIsExitAlertOpen } =
    usePvPMatchingExitGuard({
      // 방 나가기 API용 토큰
      accessToken,
      // 참가자인 경우에만 exit API를 수행하도록 participant room id를 전달
      joinedRoomId: participantRoomId,
      // 이탈 시 소켓 정리
      cleanupMatchingConnection,
    })

  // 실시간 status가 있으면 우선 사용, 없으면 초기 방 상태 사용
  const latestRoomStatus = liveRoomStatus ?? resolvedRoomDetails?.status ?? null
  // FINISHED 여부
  const isFinishedStatus = latestRoomStatus === FINISHED_ROOM_STATUS
  // 취소/만료 여부
  const shouldRouteToMain =
    latestRoomStatus === CANCELED_ROOM_STATUS || latestRoomStatus === EXPIRED_ROOM_STATUS

  // 녹음 시작/종료/제출을 담당하는 컨트롤러
  const {
    // 현재 녹음 중 여부
    isRecording,
    // 일시정지 여부(현재 PvP는 pause 비활성 설계지만 UI 호환으로 유지)
    isPaused,
    // 녹음 경과 초
    elapsedSeconds,
    // 녹음 완료 blob
    recordedBlob,
    // 마이크 상호작용 허용 여부
    isMicInteractionAllowed,
    // 제출 API 처리 중 여부
    isSubmittingSubmission,
    // 제출 완료 상태(로더 유지용)
    isSubmissionCompleted,
    // self ANSWER_SUBMITTED 수신 시 완료 상태 동기화 함수
    markSubmissionCompleted,
    // 마이크 클릭 핸들러
    handlePvPMicClick,
  } = usePvPRecordController({
    accessToken,
    roomId: socketRoomId,
    roomStatus: latestRoomStatus,
  })

  // FINISHED 수신 시 피드백 페이지로 1회만 이동
  useEffect(() => {
    // 취소/만료 상태가 아니면 아무것도 하지 않음
    if (!shouldRouteToMain) return
    // 이미 이동 중이면 중복 실행 방지
    if (hasRoutedToMainRef.current) return

    hasRoutedToMainRef.current = true

    // 소켓 정리 후 메인으로 이동
    const moveToMainPage = async () => {
      await cleanupMatchingConnection()
      router.replace(MAIN_PAGE_PATH)
    }

    void moveToMainPage()
  }, [cleanupMatchingConnection, router, shouldRouteToMain])

  useEffect(() => {
    // FINISHED가 아니면 아무것도 하지 않음
    if (!isFinishedStatus) return
    // 이미 라우팅 중/완료면 중복 실행 방지
    if (hasRoutedToFeedbackRef.current) return
    // 취소/만료 라우팅이 우선이다.
    if (shouldRouteToMain) return

    // 참가자 room id가 있으면 우선 사용, 없으면 URL room id fallback
    const targetRoomId = participantRoomId ?? roomId
    // id가 비정상이면 중단
    if (!targetRoomId || Number.isNaN(targetRoomId)) return

    // 중복 이동 방지 플래그 on
    hasRoutedToFeedbackRef.current = true

    // 소켓 정리 후 피드백 페이지로 교체 이동
    const moveToFeedbackPage = async () => {
      await cleanupMatchingConnection()
      router.replace(`${PVP_FEEDBACK_PATH_PREFIX}/${targetRoomId}`)
    }

    // 비동기 실행
    void moveToFeedbackPage()
  }, [
    cleanupMatchingConnection,
    isFinishedStatus,
    participantRoomId,
    roomId,
    router,
    shouldRouteToMain,
  ])

  // URL id가 잘못되면 즉시 에러 메시지 렌더
  if (isInvalidRoomId) {
    return <StatusMessage message={INVALID_ROOM_ID_MESSAGE} />
  }

  // 필수 데이터 로딩 중이면 로딩 메시지 렌더
  if (isProfileLoading || isRoomLoading || isJoinLoading) {
    return <StatusMessage message={LOADING_MESSAGE} />
  }

  // 방 조회 자체가 실패했거나 방 데이터가 없으면 진입 실패 처리
  if (roomDetailsQuery.isError || !roomDetailsFromServer) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  // join이 필요한 케이스에서 join 실패 시 진입 실패 처리
  if (shouldAttemptJoinRoom && (roomJoinQuery.isError || roomJoinQuery.data?.ok === false)) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  // 최종 방 데이터가 없거나 참가자가 아니면 접근 거부 처리
  if (!resolvedRoomDetails || !isParticipantUser) {
    return <StatusMessage message={ROOM_ACCESS_DENIED_MESSAGE} />
  }

  // UI 렌더 기준 room status (실시간 우선)
  const roomStatusForDisplay = liveRoomStatus ?? resolvedRoomDetails.status
  // RECORDING 단계 여부 (헤더 step/마이크 UI 분기에 사용)
  const isRecordingStep = roomStatusForDisplay === RECORDING_ROOM_STATUS
  // PROCESSING 단계 여부
  const isProcessingStep = roomStatusForDisplay === PROCESSING_ROOM_STATUS
  // OPEN + HOST 상태면 대기 화면(PvPMatchingWaiting) 렌더
  const isHostWaitingOpenState =
    roomStatusForDisplay === OPEN_ROOM_STATUS && resolvedRoomDetails.host.id === myUserId
  // 대기 화면이 아닐 때만 전투 UI(키워드/녹음/준비 버튼)를 렌더
  const shouldRenderBattleUi = !isHostWaitingOpenState
  // 녹음/처리/완료 단계에서는 헤더 뒤로가기 비활성화
  const isHeaderBackDisabled =
    roomStatusForDisplay === RECORDING_ROOM_STATUS ||
    roomStatusForDisplay === PROCESSING_ROOM_STATUS ||
    roomStatusForDisplay === FINISHED_ROOM_STATUS

  // THINKING에서 소켓 키워드가 오면 우선, 없으면 초기 keyword 사용
  const keywordNameForDisplay = thinkingKeywordName ?? resolvedRoomDetails.keyword?.name ?? ''
  // THINKING 단계 여부(카운트다운/준비 버튼 분기에 사용)
  const isThinkingStep = roomStatusForDisplay === THINKING_ROOM_STATUS
  // 제출/처리/완료 상태에서는 로더를 표시
  const shouldShowFeedbackLoader =
    isSubmittingSubmission || isSubmissionCompleted || isProcessingStep || isFinishedStatus

  // 준비 버튼 활성 조건
  const canStartPvPRecording =
    // THINKING 단계여야 준비 버튼 동작
    isThinkingStep &&
    // 인증 토큰 필요
    Boolean(accessToken) &&
    // 방 id 필요
    Boolean(socketRoomId) &&
    // start-recording 요청 중이 아니어야 함
    !isStartingRecordingRequest &&
    // 이미 준비를 누르지 않았어야 함
    !isReadySubmitted

  // 준비 버튼 클릭 핸들러
  const handleReadyButtonClick = async () => {
    // 필수값 없거나 요청 중복이면 중단
    if (!accessToken || !socketRoomId) return
    if (isReadySubmitted || isStartingRecordingRequest) return

    // 중복 클릭 방지 상태 on
    setIsReadySubmitted(true)
    setIsStartingRecordingRequest(true)
    // 서버에 RECORDING 시작 요청
    const startRecordingResult = await startPvPRecording(accessToken, socketRoomId)
    // 요청 종료
    setIsStartingRecordingRequest(false)

    // 실패 시 준비 상태 롤백 + 토스트
    if (!startRecordingResult.ok) {
      setIsReadySubmitted(false)
      toast.error(START_RECORDING_ERROR_MESSAGE)
      return
    }

    // 성공 시 응답 status를 즉시 UI 상태에 반영
    setLiveRoomStatus(startRecordingResult.data.status)
  }

  return (
    // 페이지 전체 세로 레이아웃
    <div className="flex h-full w-full flex-col gap-4">
      {/* 상단 모드 헤더 */}
      <ModeHeader
        mode="pvp"
        step={isRecordingStep ? 'recording' : 'battle'}
        onBack={handleBack}
        backDisabled={isHeaderBackDisabled}
      />
      {/* 카테고리 정보 */}
      <PvPCategory categoryName={resolvedRoomDetails.category.name} />
      {/* host가 OPEN 상태로 대기 중이면 waiting UI, 아니면 참가자 UI */}
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
      {/* host OPEN 대기 상태가 아닐 때만 전투 UI 렌더 */}
      {shouldRenderBattleUi ? (
        <>
          {/* 현재 대결 키워드 */}
          <PvPKeyword keywordName={keywordNameForDisplay} />
          {/* THINKING 단계 카운트다운 */}
          <PvPThinkingCountdown
            isThinkingStep={isThinkingStep}
            thinkingEndsAtMs={thinkingEndsAtMs}
          />
          {/* 제출/처리/완료 상태면 로더, 아니면 마이크 박스 */}
          {shouldShowFeedbackLoader ? (
            <FeedbackLoader status={isProcessingStep ? 'PROCESSING' : 'PENDING'} />
          ) : (
            <MicrophoneBox
              // 마이크 클릭은 컨트롤러 핸들러로 위임
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
          {/* 녹음 가이드 박스 */}
          <RecordTipBox />
          {/* 준비 버튼 영역 */}
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
      {/* 매칭 종료 확인 모달 */}
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

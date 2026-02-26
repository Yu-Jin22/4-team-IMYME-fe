'use client'

// ✅ React Query: 방 참가(join) 요청 상태 관리
import { useQuery } from '@tanstack/react-query'
// ✅ 라우트 파라미터(roomId) 읽기 + 뒤로가기 이동에 사용
import { useParams, useRouter } from 'next/navigation'
// ✅ 상태/구독/콜백/수명주기 관리
import { useCallback, useEffect, useRef, useState } from 'react'
// ✅ 요청 실패 시 사용자에게 토스트 노출
import { toast } from 'sonner'

// ✅ PvP 화면 표시용 도메인 UI (카테고리/키워드)
import { PvPCategory, PvPKeyword } from '@/entities/pvp-card'
// ✅ 인증 토큰 가져오기
import { useAccessToken } from '@/features/auth'
// ✅ PvP 도메인 API/참가자 UI
import { joinPvPRoom, PvPParticipants, startPvPRecording } from '@/features/pvp'
// ✅ 공통 녹음 UI/로직 (PVP 모드로 사용)
import { MicrophoneBox, useRecordController } from '@/features/record'
// ✅ 공통 헤더/안내 UI + STOMP 소켓 훅
import { ModeHeader, RecordTipBox, StatusMessage, useStompClient } from '@/shared'

// ✅ STOMP 수신 메시지 타입, 구독 해제 객체 타입
import type { IMessage, StompSubscription } from '@stomp/stompjs'

// ✅ 화면 상태별 메시지 상수 (매직 문자열 제거)
const LOADING_MESSAGE = '매칭 방에 입장하는 중입니다...'
const ERROR_MESSAGE = '매칭 방에 입장하지 못했습니다.'
const INVALID_ROOM_ID_MESSAGE = '잘못된 방 정보입니다.'
const START_RECORDING_ERROR_MESSAGE = '녹음 시작 요청에 실패했습니다. 다시 시도해주세요.'
const EMPTY_GUEST_NAME = '...'
// ✅ 소켓 메시지 타입/방 상태 문자열 상수
const STATUS_CHANGE_MESSAGE_TYPE = 'STATUS_CHANGE'
const THINKING_ROOM_STATUS = 'THINKING'
const RECORDING_ROOM_STATUS = 'RECORDING'
// ✅ 카운트다운 표시용 시간 상수
const COUNTDOWN_TICK_MS = 1000
const ONE_SECOND_MS = 1000
const ONE_MINUTE_SECONDS = 60
const TIME_PAD_LENGTH = 2

// ✅ 남은 시간(ms)을 "M:SS" 문자열로 변환
const formatCountdown = (remainingMs: number) => {
  // 남은 시간이 음수로 내려가도 0초 이하로는 표시하지 않음
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / ONE_SECOND_MS))
  const minutes = Math.floor(totalSeconds / ONE_MINUTE_SECONDS)
  const seconds = totalSeconds % ONE_MINUTE_SECONDS

  return `${minutes}:${String(seconds).padStart(TIME_PAD_LENGTH, '0')}`
}

// ✅ /topic/pvp/{roomId}로 들어오는 공통 메시지 최소 shape
type PvpMatchingMessage = {
  type: string
  roomId: number
  data: Record<string, unknown> | null
}

// ✅ 런타임에서 메시지 shape를 최소 검증 (JSON.parse 결과가 unknown이므로 방어)
const isPvpMatchingMessage = (value: unknown): value is PvpMatchingMessage => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.type === 'string' &&
    typeof candidate.roomId === 'number' &&
    (candidate.data === null ||
      (typeof candidate.data === 'object' && !Array.isArray(candidate.data)))
  )
}

// ✅ STATUS_CHANGE payload에서 status만 안전하게 추출
const getStatusFromMessageData = (data: PvpMatchingMessage['data']) => {
  const status = data?.status
  return typeof status === 'string' ? status : null
}

// ✅ THINKING payload에서 keyword.name만 안전하게 추출
const getKeywordNameFromMessageData = (data: PvpMatchingMessage['data']) => {
  const keyword = data?.keyword
  if (!keyword || typeof keyword !== 'object' || Array.isArray(keyword)) return null

  const candidate = keyword as Record<string, unknown>
  return typeof candidate.name === 'string' ? candidate.name : null
}

// ✅ THINKING payload에서 thinkingEndsAt(ISO 문자열)를 epoch ms로 변환
const getThinkingEndsAtMsFromMessageData = (data: PvpMatchingMessage['data']) => {
  const thinkingEndsAt = data?.thinkingEndsAt
  if (typeof thinkingEndsAt !== 'string') return null

  const parsedMs = Date.parse(thinkingEndsAt)
  return Number.isNaN(parsedMs) ? null : parsedMs
}

export function PvPMatchingPage() {
  // ✅ 페이지 이동(뒤로가기) 및 상태 전환 시 라우팅에 사용
  const router = useRouter()
  // ✅ /pvp/matching/[id] 라우트의 room id 파라미터 읽기
  const params = useParams<{ id: string }>()
  // ✅ API / STOMP 인증용 access token
  const accessToken = useAccessToken()
  // ✅ 소켓 onConnect/onMessage 콜백에서 사용할 현재 roomId (stale closure 방지)
  const roomIdRef = useRef<number | null>(null)
  // ✅ 현재 구독 객체 보관 (재구독/해제용)
  const roomSubscriptionRef = useRef<StompSubscription | null>(null)
  // ✅ 로컬 녹음 시작 중복 호출 방지 플래그
  const isStartingLocalRecordingRef = useRef(false)
  // ✅ 소켓으로 들어온 최신 방 상태 (join 응답 상태보다 우선)
  const [liveRoomStatus, setLiveRoomStatus] = useState<string | null>(null)
  // ✅ THINKING 시점에 서버가 보낸 실시간 키워드명
  const [thinkingKeywordName, setThinkingKeywordName] = useState<string | null>(null)
  // ✅ THINKING 종료 시각(epoch ms)
  const [thinkingEndsAtMs, setThinkingEndsAtMs] = useState<number | null>(null)
  // ✅ 카운트다운 갱신용 현재 시각 (1초마다 업데이트)
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now())
  // ✅ 공통 녹음 컨트롤러를 PVP 모드로 사용 (warmup 없이 녹음)
  const {
    isStartingWarmup,
    warmupError,
    handleMicClick,
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlob,
  } = useRecordController({ mode: 'pvp' })
  // ✅ URL 파라미터 문자열을 숫자로 변환
  const roomId = Number(params.id)
  // ✅ 잘못된 roomId(예: NaN) 방어
  const isInvalidRoomId = Number.isNaN(roomId)

  // ✅ STOMP(SockJS) 연결 훅: 수동 연결(autoConnect=false)로 room join 성공 후 연결
  const {
    connect: connectMatchingSocket,
    disconnect: disconnectMatchingSocket,
    publish: publishMatchingMessage,
    subscribe: subscribeMatchingTopic,
  } = useStompClient({
    accessToken,
    autoConnect: false,
    // ✅ 소켓 연결 완료 시 구독 + 세션 등록 수행
    onConnect: () => {
      const currentRoomId = roomIdRef.current
      if (!currentRoomId) return

      // ✅ 재연결 시 중복 구독 방지: 기존 구독 먼저 해제
      roomSubscriptionRef.current?.unsubscribe()
      roomSubscriptionRef.current = subscribeMatchingTopic(
        `/topic/pvp/${currentRoomId}`,
        (message: IMessage) => {
          let parsedMessage: unknown

          // ✅ 서버 메시지는 문자열이므로 JSON.parse 실패 가능성 방어
          try {
            parsedMessage = JSON.parse(message.body)
          } catch {
            return
          }

          // ✅ 내가 기대하는 메시지 형식이 아니면 무시
          if (!isPvpMatchingMessage(parsedMessage)) return
          // ✅ 현재 페이지에서 필요한 건 STATUS_CHANGE 메시지뿐
          if (parsedMessage.type !== STATUS_CHANGE_MESSAGE_TYPE) return
          // ✅ 다른 방 메시지가 섞여 오면 무시
          if (parsedMessage.roomId !== currentRoomId) return

          const roomStatus = getStatusFromMessageData(parsedMessage.data)
          if (!roomStatus) return

          // ✅ UI 표시용 방 상태를 소켓 최신값으로 업데이트
          setLiveRoomStatus(roomStatus)

          if (roomStatus === RECORDING_ROOM_STATUS) {
            // ✅ RECORDING으로 넘어가면 THINKING 카운트다운은 더 이상 필요 없음
            setThinkingEndsAtMs(null)
            return
          }

          // ✅ THINKING 상태가 아닐 때는 키워드/카운트다운 갱신 로직 실행 안 함
          if (roomStatus !== THINKING_ROOM_STATUS) return

          const nextKeywordName = getKeywordNameFromMessageData(parsedMessage.data)
          if (!nextKeywordName) return

          // ✅ THINKING 상태에서 공개된 키워드를 즉시 UI 반영
          setThinkingKeywordName(nextKeywordName)

          const nextThinkingEndsAtMs = getThinkingEndsAtMsFromMessageData(parsedMessage.data)
          if (nextThinkingEndsAtMs) {
            // ✅ THINKING 종료 시각 저장 + 카운트다운 즉시 재계산 시작점 갱신
            setThinkingEndsAtMs(nextThinkingEndsAtMs)
            setCountdownNowMs(Date.now())
          }
        },
      )

      // ✅ 서버에 "이 방의 세션에 참여 중"임을 등록 (구독 이후 전송)
      publishMatchingMessage(`/app/pvp/${currentRoomId}/register-session`, JSON.stringify({}))
    },
  })

  // ✅ 매칭 페이지 진입 시 방 참가(join) 요청
  const roomJoinQuery = useQuery({
    queryKey: ['pvpRoomJoin', roomId],
    // ✅ 토큰이 있고 roomId가 정상일 때만 join 요청
    enabled: Boolean(accessToken) && !isInvalidRoomId,
    queryFn: async () => {
      if (!accessToken || isInvalidRoomId) {
        return { ok: false as const, reason: 'invalid_request' as const }
      }

      return joinPvPRoom(accessToken, roomId)
    },
  })

  // ✅ 헤더 뒤로가기 버튼 핸들러
  const handleBack = () => {
    router.back()
  }

  // ✅ "아직 로컬 녹음이 시작되지 않았을 때만" 녹음 시작
  //    - THINKING에서 start-recording API 성공 후
  //    - 또는 STATUS_CHANGE(RECORDING) 수신 후 자동 시작
  const startLocalRecordingIfNeeded = useCallback(async () => {
    // 이미 녹음 중이거나 녹음본이 있으면 중복 시작 금지
    if (isRecording || Boolean(recordedBlob)) return
    // 녹음 시작 비동기 처리 중이면 중복 호출 금지
    if (isStartingLocalRecordingRef.current) return

    isStartingLocalRecordingRef.current = true
    try {
      // useRecordController의 마이크 클릭 로직(권한/녹음 시작)을 재사용
      await handleMicClick()
    } finally {
      isStartingLocalRecordingRef.current = false
    }
  }, [handleMicClick, isRecording, recordedBlob])

  // ✅ join 성공 후 roomId ref 저장 + 소켓 연결 시작
  useEffect(() => {
    if (!roomJoinQuery.data?.ok) return

    roomIdRef.current = roomJoinQuery.data.data.room.id
    connectMatchingSocket()
  }, [connectMatchingSocket, roomJoinQuery.data])

  // ✅ THINKING 카운트다운 1초 ticker
  useEffect(() => {
    if (!thinkingEndsAtMs) return

    const timerId = window.setInterval(() => {
      setCountdownNowMs(Date.now())
    }, COUNTDOWN_TICK_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [thinkingEndsAtMs])

  // ✅ 페이지 이탈 시 구독/소켓 정리 (메모리 누수 및 중복 연결 방지)
  useEffect(() => {
    return () => {
      roomSubscriptionRef.current?.unsubscribe()
      roomSubscriptionRef.current = null
      roomIdRef.current = null
      void disconnectMatchingSocket()
    }
  }, [disconnectMatchingSocket])

  // ✅ 상태가 RECORDING이면 로컬 녹음을 자동 시작
  //    - THINKING에서 서버가 RECORDING으로 바뀐 뒤 들어온 경우
  //    - 페이지 새로고침 후 join 응답이 이미 RECORDING 상태인 경우
  useEffect(() => {
    const joinedRoomDetails = roomJoinQuery.data?.ok ? roomJoinQuery.data.data : null
    if (!joinedRoomDetails) return

    const currentRoomStatus = liveRoomStatus ?? joinedRoomDetails.status
    if (currentRoomStatus !== RECORDING_ROOM_STATUS) return

    void startLocalRecordingIfNeeded()
  }, [liveRoomStatus, roomJoinQuery.data, startLocalRecordingIfNeeded])

  // ✅ roomId가 잘못되면 바로 종료
  if (isInvalidRoomId) {
    return <StatusMessage message={INVALID_ROOM_ID_MESSAGE} />
  }

  // ✅ join 요청 진행 중 로딩 표시
  if (roomJoinQuery.isLoading) {
    return <StatusMessage message={LOADING_MESSAGE} />
  }

  // ✅ join 실패/네트워크 오류/빈 응답 처리
  if (roomJoinQuery.isError || roomJoinQuery.data?.ok === false || !roomJoinQuery.data) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  // ✅ 아래부터는 join 성공 데이터 사용 가능
  const roomDetails = roomJoinQuery.data.data
  // 소켓 상태가 오면 그 값을 우선, 아직 없으면 join 응답 status 사용
  const roomStatusForDisplay = liveRoomStatus ?? roomDetails.status
  // 녹음 단계 여부 (헤더 step 표시 등에 사용)
  const isRecordingStep = roomStatusForDisplay === RECORDING_ROOM_STATUS
  // 생각 단계 여부 (마이크 클릭 허용/카운트다운 표시에 사용)
  const isThinkingStep = roomStatusForDisplay === THINKING_ROOM_STATUS
  // THINKING 소켓 메시지로 받은 키워드가 있으면 우선, 없으면 join 응답 keyword 사용
  const keywordNameForDisplay = thinkingKeywordName ?? roomDetails.keyword?.name ?? ''
  // THINKING 종료까지 남은 시간(ms)
  const remainingThinkingMs = thinkingEndsAtMs ? thinkingEndsAtMs - countdownNowMs : 0
  // THINKING 상태일 때만 카운트다운 표시
  const shouldShowThinkingCountdown =
    roomStatusForDisplay === THINKING_ROOM_STATUS &&
    Boolean(thinkingEndsAtMs) &&
    remainingThinkingMs > 0
  // THINKING/RECORDING(또는 이미 녹음 중) 상태에서만 마이크 상호작용 허용
  const isMicInteractionAllowed = isThinkingStep || isRecordingStep || isRecording

  // ✅ PvP용 마이크 버튼 동작
  // - 녹음 중이면 pause/resume 토글
  // - THINKING이면 start-recording API 호출 후 로컬 녹음 시작
  // - RECORDING이면 서버 상태 변경에 맞춰 로컬 녹음 시작(미시작 상태일 때)
  const handlePvPMicClick = async () => {
    if (isRecording) {
      await handleMicClick()
      return
    }

    if (isThinkingStep) {
      if (!accessToken) return

      // ✅ 서버에 "이제 녹음 단계로 전환" 요청
      const startRecordingResult = await startPvPRecording(accessToken, roomDetails.room.id)
      if (!startRecordingResult.ok) {
        toast.error(START_RECORDING_ERROR_MESSAGE)
        return
      }

      // ✅ 서버 응답 성공 즉시 로컬 녹음도 시작 (이후 STATUS_CHANGE RECORDING도 들어올 수 있음)
      await startLocalRecordingIfNeeded()
      return
    }

    // ✅ 이미 RECORDING 상태라면 로컬 녹음만 시작 시도
    if (isRecordingStep) {
      await startLocalRecordingIfNeeded()
    }
  }

  return (
    // ✅ PvP 매칭/생각/녹음을 한 화면에서 처리하는 컨테이너
    <div className="flex h-full w-full flex-col gap-4">
      <ModeHeader
        mode="pvp"
        // 서버 방 상태에 따라 battle -> recording step 라벨 전환
        step={isRecordingStep ? 'recording' : 'battle'}
        onBack={handleBack}
      />
      {/* 방 카테고리 표시 */}
      <PvPCategory categoryName={roomDetails.category.name} />
      {/* 참가자(호스트/게스트) 표시. guest는 아직 없을 수 있어 fallback 처리 */}
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
      {/* THINKING 이후 공개되는 키워드 표시 */}
      <PvPKeyword keywordName={keywordNameForDisplay} />
      {shouldShowThinkingCountdown ? (
        // THINKING 단계에서만 남은 생각 시간 표시
        <p className="text-primary text-center text-sm font-semibold">
          남은 생각 시간 {formatCountdown(remainingThinkingMs)}
        </p>
      ) : null}
      {/* PVP 녹음 UI: THINKING/RECORDING 상태에서만 상호작용 허용 */}
      <MicrophoneBox
        isStartingWarmup={isStartingWarmup}
        warmupError={warmupError}
        onMicClick={() => {
          // 버튼 핸들러는 Promise를 반환하므로 void로 fire-and-forget
          void handlePvPMicClick()
        }}
        title="음성으로 말해보세요."
        description="버튼을 눌러 녹음을 시작하세요."
        errorMessage="녹음 시작에 실패했습니다."
        // 녹음본이 이미 있거나 아직 THINKING/RECORDING 단계가 아니면 비활성화
        isMicDisabled={Boolean(recordedBlob) || !isMicInteractionAllowed}
        isRecording={isRecording}
        isPaused={isPaused}
        elapsedSeconds={elapsedSeconds}
      />
      {/* 녹음 안내 문구 */}
      <RecordTipBox />
    </div>
  )
}

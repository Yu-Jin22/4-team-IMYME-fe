'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { usePvPRoomTopicSocket } from './usePvPRoomTopicSocket'

import type { PvpSocketMessage } from './pvpSocketMessage'

const STATUS_CHANGE_MESSAGE_TYPE = 'STATUS_CHANGE'
const PLAYER_READY_MESSAGE_TYPE = 'PLAYER_READY'
const ANSWER_SUBMITTED_MESSAGE_TYPE = 'ANSWER_SUBMITTED'
const THINKING_ROOM_STATUS = 'THINKING'
const RECORDING_ROOM_STATUS = 'RECORDING'

const WAIT_OPPONENT_READY_TOAST_MESSAGE = '상대방이 준비할 때까지 기다려주세요.'
const OPPONENT_READY_TOAST_MESSAGE = '상대방이 준비되었습니다.'
const READY_UPDATED_TOAST_MESSAGE = '준비 상태가 갱신되었습니다.'
const ANSWER_SUBMITTED_UPDATED_TOAST_MESSAGE = '제출 상태가 갱신되었습니다.'

// THINKING 종료 시각 ISO 문자열을 epoch ms로 변환한다.
const parseThinkingEndsAtMs = (thinkingEndsAt: string | null) => {
  // 종료 시각이 없으면 null
  if (!thinkingEndsAt) return null

  // 종료 시각 문자열을 epoch ms로 변환
  const parsedMs = Date.parse(thinkingEndsAt)
  // 파싱 실패(NaN)면 null, 성공이면 ms
  return Number.isNaN(parsedMs) ? null : parsedMs
}

// 매칭 페이지 소켓 훅 입력 파라미터
type UsePvPMatchingSocketParams = {
  accessToken: string | null
  joinedRoomId: number | null
  myUserId: number | undefined
  // 내가 준비 버튼을 눌렀을 때 실행할 콜백 (버튼 비활성화 등에 사용)
  onSelfReady?: () => void
  // 내가 제출 완료 이벤트를 받았을 때 실행할 콜백
  onSelfAnswerSubmitted?: () => void
  // 상대가 제출 완료 이벤트를 보냈을 때 실행할 콜백
  onOpponentAnswerSubmitted?: () => void
}

// 매칭 페이지 소켓 훅 반환 타입
type UsePvPMatchingSocketResult = {
  // 서버 실시간 room status
  liveRoomStatus: string | null
  // THINKING 단계에서 내려오는 키워드명
  thinkingKeywordName: string | null
  // THINKING 종료 절대 시각(ms)
  thinkingEndsAtMs: number | null
  // 외부에서 status를 강제로 덮어쓸 때 사용하는 setter
  setLiveRoomStatus: (status: string | null) => void
  // 페이지 이탈 시 구독/연결 정리 함수
  cleanupMatchingConnection: () => Promise<void>
}

export function usePvPMatchingSocket({
  accessToken,
  joinedRoomId,
  myUserId,
  onSelfReady,
  onSelfAnswerSubmitted,
  onOpponentAnswerSubmitted,
}: UsePvPMatchingSocketParams): UsePvPMatchingSocketResult {
  // 소켓 콜백 내부에서 최신 myUserId를 참조하기 위한 ref (stale closure 방지)
  const myUserIdRef = useRef<number | undefined>(myUserId)

  // 현재 방 상태(OPEN/THINKING/RECORDING/...)를 저장
  const [liveRoomStatus, setLiveRoomStatus] = useState<string | null>(null)

  const [thinkingKeywordName, setThinkingKeywordName] = useState<string | null>(null)
  // THINKING 종료 시각(ms)을 저장
  const [thinkingEndsAtMs, setThinkingEndsAtMs] = useState<number | null>(null)

  // 외부에서 myUserId가 바뀌면 ref도 최신값으로 동기화
  useEffect(() => {
    myUserIdRef.current = myUserId
  }, [myUserId])

  // /topic/pvp/{roomId} 메시지를 처리하는 콜백
  const handleTopicMessage = useCallback(
    (message: PvpSocketMessage) => {
      // PLAYER_READY 이벤트 처리
      if (message.type === PLAYER_READY_MESSAGE_TYPE) {
        const readyUserId = message.data.userId

        const currentMyUserId = myUserIdRef.current
        if (!currentMyUserId) {
          toast.info(message.data.message ?? READY_UPDATED_TOAST_MESSAGE)
          return
        }

        if (readyUserId === currentMyUserId) {
          onSelfReady?.()
          toast.info(WAIT_OPPONENT_READY_TOAST_MESSAGE)
          return
        }

        toast.info(OPPONENT_READY_TOAST_MESSAGE)
        return
      }

      if (message.type === ANSWER_SUBMITTED_MESSAGE_TYPE) {
        const submittedUserId = message.data.userId
        const currentMyUserId = myUserIdRef.current
        if (!currentMyUserId) {
          toast.info(message.data.message ?? ANSWER_SUBMITTED_UPDATED_TOAST_MESSAGE)
          return
        }

        if (submittedUserId === currentMyUserId) {
          onSelfAnswerSubmitted?.()
          return
        }

        onOpponentAnswerSubmitted?.()
        return
      }

      if (message.type !== STATUS_CHANGE_MESSAGE_TYPE) return

      const roomStatus = message.data.status
      setLiveRoomStatus(roomStatus)

      // RECORDING으로 바뀌면 thinking countdown 정보는 더 이상 필요 없다.
      if (roomStatus === RECORDING_ROOM_STATUS) {
        setThinkingEndsAtMs(null)
        return
      }

      // THINKING이 아니면 키워드/카운트다운 처리를 하지 않는다.
      if (roomStatus !== THINKING_ROOM_STATUS) return

      const nextKeywordName = message.data.keyword?.name ?? null
      if (!nextKeywordName) return
      setThinkingKeywordName(nextKeywordName)

      const nextThinkingEndsAtMs = parseThinkingEndsAtMs(message.data.thinkingEndsAt)
      if (nextThinkingEndsAtMs) {
        setThinkingEndsAtMs(nextThinkingEndsAtMs)
      }
    },
    [onOpponentAnswerSubmitted, onSelfAnswerSubmitted, onSelfReady],
  )

  // 공통 room-topic 소켓 훅을 사용해 연결/구독/정리를 위임
  const { cleanupConnection: cleanupMatchingConnection } = usePvPRoomTopicSocket({
    accessToken,
    roomId: joinedRoomId,
    onTopicMessage: handleTopicMessage,
  })

  return {
    liveRoomStatus,
    thinkingKeywordName,
    thinkingEndsAtMs,
    setLiveRoomStatus,
    cleanupMatchingConnection,
  }
}

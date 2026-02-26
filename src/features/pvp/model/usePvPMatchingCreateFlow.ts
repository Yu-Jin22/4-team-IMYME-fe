'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { createPvPRoom, deletePvPRoom } from '@/entities/room'
import { useAccessToken } from '@/features/auth'
import { useStompClient } from '@/shared'

import type { CategoryItemType } from '@/entities/category'
import type { IMessage, StompSubscription } from '@stomp/stompjs'
const ROOM_JOINED_MESSAGE_TYPE = 'ROOM_JOINED'
const ROOM_LEFT_MESSAGE_TYPE = 'ROOM_LEFT'
const STATUS_CHANGE_MESSAGE_TYPE = 'STATUS_CHANGE'
const ANSWER_SUBMITTED_MESSAGE_TYPE = 'ANSWER_SUBMITTED'
const EXIT_ROOM_ERROR_MESSAGE = '방을 나가던 중 오류가 발생하였습니다.'
const normalizeRoomNameBoundarySpaces = (value: string) => value.trim()

type PvpMessageType =
  | typeof STATUS_CHANGE_MESSAGE_TYPE
  | typeof ROOM_JOINED_MESSAGE_TYPE
  | typeof ROOM_LEFT_MESSAGE_TYPE
  | typeof ANSWER_SUBMITTED_MESSAGE_TYPE

type PvpWebSocketMessage = {
  type: PvpMessageType
  roomId: number
  data: Record<string, unknown> | null
  message: string | null
  timestamp: number
}

const isPvpWebSocketMessage = (value: unknown): value is PvpWebSocketMessage => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  const isValidType =
    candidate.type === STATUS_CHANGE_MESSAGE_TYPE ||
    candidate.type === ROOM_JOINED_MESSAGE_TYPE ||
    candidate.type === ROOM_LEFT_MESSAGE_TYPE ||
    candidate.type === ANSWER_SUBMITTED_MESSAGE_TYPE

  return (
    isValidType &&
    typeof candidate.roomId === 'number' &&
    (candidate.data === null ||
      (typeof candidate.data === 'object' && !Array.isArray(candidate.data))) &&
    (candidate.message === null || typeof candidate.message === 'string') &&
    typeof candidate.timestamp === 'number'
  )
}

const getStatusFromMessageData = (data: PvpWebSocketMessage['data']) => {
  const status = data?.status
  return typeof status === 'string' ? status : null
}

type UsePvPMatchingCreateFlowParams = {
  onExitGuardChange?: (isActive: boolean) => void
}

type UsePvPMatchingCreateFlowResult = {
  selectedCategory: CategoryItemType | null
  isNextClicked: boolean | null
  isWaiting: boolean
  isComplete: boolean
  roomName: string
  isCreateButtonDisabled: boolean
  createButtonVariant: 'category' | 'create' | 'waiting' | 'complete'
  handleCategorySelect: (category: CategoryItemType) => void
  handleRoomNameChange: (value: string) => void
  handleRoomNameBlur: () => void
  handleCreateButtonClick: () => Promise<void>
  handleExitConfirm: () => Promise<boolean>
}

export function usePvPMatchingCreateFlow({
  onExitGuardChange,
}: UsePvPMatchingCreateFlowParams): UsePvPMatchingCreateFlowResult {
  const [selectedCategory, setSelectedCategory] = useState<CategoryItemType | null>(null)
  const [isNextClicked, setIsNextClicked] = useState<boolean | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [roomName, setRoomName] = useState('')
  const currentRoomIdRef = useRef<number | null>(null)
  const roomSubscriptionRef = useRef<StompSubscription | null>(null)

  const router = useRouter()
  const accessToken = useAccessToken()
  const {
    connect: connectMatchingSocket,
    disconnect: disconnectMatchingSocket,
    publish: publishMatchingMessage,
    subscribe: subscribeMatchingTopic,
  } = useStompClient({
    accessToken,
    autoConnect: false,
    onConnect: () => {
      const roomId = currentRoomIdRef.current
      if (!roomId) return

      // 재연결 시 중복 구독을 피하기 위해 기존 구독이 있으면 먼저 해제한다.
      roomSubscriptionRef.current?.unsubscribe()

      // 방 상태 업데이트 구독: /topic/pvp/{roomId}
      roomSubscriptionRef.current = subscribeMatchingTopic(
        `/topic/pvp/${roomId}`,
        (message: IMessage) => {
          let parsedMessage: unknown

          try {
            parsedMessage = JSON.parse(message.body)
          } catch {
            return
          }

          if (!isPvpWebSocketMessage(parsedMessage)) return
          if (parsedMessage.roomId !== roomId) return

          if (parsedMessage.type === ROOM_JOINED_MESSAGE_TYPE) {
            setIsWaiting(false)
            setIsComplete(true)
            return
          }

          if (parsedMessage.type === ROOM_LEFT_MESSAGE_TYPE) {
            setIsComplete(false)
            setIsWaiting(true)
            return
          }

          if (parsedMessage.type === ANSWER_SUBMITTED_MESSAGE_TYPE) {
            // 생성/매칭 대기 플로우에서는 제출 이벤트를 직접 사용하지 않는다.
            return
          }

          const roomStatus = getStatusFromMessageData(parsedMessage.data)
          if (!roomStatus) return

          if (roomStatus === 'OPEN') {
            setIsComplete(false)
            setIsWaiting(true)
            return
          }

          if (roomStatus === 'MATCHED') {
            setIsWaiting(false)
            setIsComplete(true)
            router.replace(`/pvp/matching/${roomId}`)
          }
        },
      )

      // 구독이 먼저 열린 뒤 세션 등록을 보내 서버가 발행하는 초기 이벤트를 놓치지 않게 한다.
      publishMatchingMessage(`/app/pvp/${roomId}/register-session`, JSON.stringify({}))
    },
  })
  useEffect(() => {
    // 수동으로 연 소켓은 화면 이탈 시 정리한다.
    return () => {
      roomSubscriptionRef.current?.unsubscribe()
      roomSubscriptionRef.current = null
      currentRoomIdRef.current = null
      void disconnectMatchingSocket()
    }
  }, [disconnectMatchingSocket])

  useEffect(() => {
    // 대기/완료 상태를 외부(Exit Guard)로 알림
    if (onExitGuardChange) {
      onExitGuardChange(isWaiting || isComplete)
    }
  }, [isComplete, isWaiting, onExitGuardChange])

  const hasSelectedCategory = Boolean(selectedCategory)
  const isCategoryStep = !isNextClicked

  // 현재 단계/상태에 맞는 버튼 variant 계산
  const createButtonVariant = useMemo(() => {
    if (isCategoryStep) return 'category'
    if (isComplete) return 'complete'
    if (isWaiting) return 'waiting'
    return 'create'
  }, [isCategoryStep, isComplete, isWaiting])

  // 카테고리 단계에서는 선택 여부, 방 이름 단계에서는 입력 여부로 버튼 비활성화
  const isFormInvalid = isCategoryStep ? !hasSelectedCategory : roomName.trim().length === 0
  // 매칭 대기/완료 상태에서는 버튼을 잠금
  const isMatchingLocked = createButtonVariant === 'waiting' || createButtonVariant === 'complete'
  const isCreateButtonDisabled = isFormInvalid || isMatchingLocked

  const handleCategorySelect = (category: CategoryItemType) => {
    // 동일 카테고리 재선택 시 해제
    setSelectedCategory((prev) => (prev?.id === category.id ? null : category))
  }

  const handleRoomNameChange = (value: string) => {
    setRoomName(value)
  }

  const handleRoomNameBlur = () => {
    setRoomName((prev) => normalizeRoomNameBoundarySpaces(prev))
  }

  const handleCreateButtonClick = async () => {
    // 카테고리 단계에서는 다음으로 이동
    if (!isNextClicked) {
      setIsNextClicked(true)
      return
    }

    if (!accessToken || !selectedCategory) return

    const normalizedRoomName = normalizeRoomNameBoundarySpaces(roomName)
    if (normalizedRoomName.length === 0) return

    const createdRoom = await createPvPRoom(accessToken, {
      categoryId: selectedCategory.id,
      roomName: normalizedRoomName,
    })

    if (!createdRoom) return

    // onConnect 콜백에서 세션 등록/구독에 사용할 roomId를 먼저 저장한다.
    currentRoomIdRef.current = createdRoom.room.id

    // 방 생성 성공 후 매칭 대기 소켓 연결을 시작한다.
    connectMatchingSocket()

    // OPEN 상태에서만 대기 화면으로 전환한다.
    if (createdRoom.status === 'OPEN' && !isWaiting) {
      setIsWaiting(true)
    }

    if (isComplete) {
      router.replace('/pvp/matching/1')
    }
  }

  const handleExitConfirm = async () => {
    const roomId = currentRoomIdRef.current

    if (roomId) {
      if (!accessToken) {
        toast.error(EXIT_ROOM_ERROR_MESSAGE)
        return false
      }

      // 방 생성자 이탈 시 서버 방 리소스를 먼저 정리한다.
      const isDeleted = await deletePvPRoom(accessToken, roomId)
      if (!isDeleted) {
        toast.error(EXIT_ROOM_ERROR_MESSAGE)
        return false
      }

      // 방 삭제 이후 세션 상태도 명시적으로 해제 요청한다.
      publishMatchingMessage(`/app/pvp/${roomId}/unregister-session`, JSON.stringify({}))
    }

    // 방 생성자가 나갈 때 구독/소켓을 먼저 정리해 서버 이벤트 수신을 중단한다.
    roomSubscriptionRef.current?.unsubscribe()
    roomSubscriptionRef.current = null
    currentRoomIdRef.current = null
    setIsWaiting(false)
    setIsComplete(false)
    await disconnectMatchingSocket()
    return true
  }

  return {
    selectedCategory,
    isNextClicked,
    isWaiting,
    isComplete,
    roomName,
    isCreateButtonDisabled,
    createButtonVariant,
    handleCategorySelect,
    handleRoomNameChange,
    handleRoomNameBlur,
    handleCreateButtonClick,
    handleExitConfirm,
  }
}

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { createPvPRoom, exitPvPRoom } from '@/entities/room'
import { useAccessToken } from '@/features/auth'

import { usePvPRoomTopicSocket } from './usePvPRoomTopicSocket'

import type { PvpSocketMessage } from './pvpSocketMessage'
import type { CategoryItemType } from '@/entities/category'

const ROOM_JOINED_MESSAGE_TYPE = 'ROOM_JOINED'
const ROOM_LEFT_MESSAGE_TYPE = 'ROOM_LEFT'
const STATUS_CHANGE_MESSAGE_TYPE = 'STATUS_CHANGE'

const EXIT_ROOM_ERROR_MESSAGE = '방을 나가던 중 오류가 발생하였습니다.'
const CREATE_ROOM_ERROR_MESSAGE = '방을 만들던 중 오류가 발생하였습니다.'
const UNREGISTER_SESSION_ACTION = 'unregister-session'

const normalizeRoomNameBoundarySpaces = (value: string) => value.trim()

// 소켓 payload(data)에서 status 문자열을 안전하게 추출한다.
const getStatusFromMessageData = (data: PvpSocketMessage['data']) => {
  const status = data?.status
  return typeof status === 'string' ? status : null
}

// 훅 입력 파라미터
type UsePvPMatchingCreateFlowParams = {
  // 상위(페이지)에서 "뒤로가기 가드 활성 여부"를 동기화할 때 사용
  onExitGuardChange?: (isActive: boolean) => void
}

// 훅 반환 타입
type UsePvPMatchingCreateFlowResult = {
  selectedCategory: CategoryItemType | null
  // 카테고리 단계 -> 방 이름 단계 전환 여부
  isNextClicked: boolean | null
  // 방 생성 후 상대 대기 상태 여부
  isWaiting: boolean
  // 상대가 들어와 매칭 완료된 상태 여부
  isComplete: boolean
  // 입력 중인 방 이름
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
  // 1단계(카테고리) -> 2단계(방 이름) 전환 state
  const [isNextClicked, setIsNextClicked] = useState<boolean | null>(null)

  const [isWaiting, setIsWaiting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [roomName, setRoomName] = useState('')
  // 현재 소켓 연결/제어에 사용할 roomId state (없으면 null)
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null)

  const router = useRouter()
  const accessToken = useAccessToken()

  // /topic/pvp/{roomId} 메시지 처리 콜백
  const handleTopicMessage = useCallback(
    (message: PvpSocketMessage) => {
      // 게스트가 입장하면 대기 -> 완료 상태로 전환
      if (message.type === ROOM_JOINED_MESSAGE_TYPE) {
        setIsWaiting(false)
        setIsComplete(true)
        return
      }

      // 게스트가 나가면 완료 -> 대기 상태로 되돌림
      if (message.type === ROOM_LEFT_MESSAGE_TYPE) {
        setIsComplete(false)
        setIsWaiting(true)
        return
      }

      // STATUS_CHANGE가 아니면 무시한다.
      if (message.type !== STATUS_CHANGE_MESSAGE_TYPE) return

      // payload에서 status를 꺼낸다.
      const roomStatus = getStatusFromMessageData(message.data)
      if (!roomStatus) return

      if (roomStatus === 'OPEN') {
        setIsComplete(false)
        setIsWaiting(true)
        return
      }

      if (roomStatus === 'MATCHED') {
        setIsWaiting(false)
        setIsComplete(true)
        router.replace(`/pvp/matching/${message.roomId}`)
      }
    },
    [router],
  )

  // 공통 room-topic 소켓 훅으로 연결/구독/publish/정리를 위임
  const { cleanupConnection, publishRoomAction } = usePvPRoomTopicSocket({
    accessToken,
    roomId: currentRoomId,
    onTopicMessage: handleTopicMessage,
  })

  // 대기/완료 상태에 따라 상위의 "이탈 가드" 상태를 동기화
  useEffect(() => {
    if (onExitGuardChange) {
      // waiting 또는 complete인 동안에는 이탈 가드를 활성화
      onExitGuardChange(isWaiting || isComplete)
    }
  }, [isComplete, isWaiting, onExitGuardChange])

  // 카테고리 선택 여부를 boolean으로 만든다.
  const hasSelectedCategory = Boolean(selectedCategory)
  // 아직 "다음" 전이면 카테고리 단계다.
  const isCategoryStep = !isNextClicked

  const createButtonVariant = useMemo(() => {
    if (isCategoryStep) return 'category'
    if (isComplete) return 'complete'
    if (isWaiting) return 'waiting'
    return 'create'
  }, [isCategoryStep, isComplete, isWaiting])

  // 단계별 필수 입력값 검증 (카테고리 또는 방 이름)
  const isFormInvalid = isCategoryStep ? !hasSelectedCategory : roomName.trim().length === 0
  // 대기/완료 상태에서는 다시 생성 동작을 잠근다.
  const isMatchingLocked = createButtonVariant === 'waiting' || createButtonVariant === 'complete'
  // 최종 버튼 비활성 조건
  const isCreateButtonDisabled = isFormInvalid || isMatchingLocked

  // 카테고리 선택/해제 토글 핸들러
  const handleCategorySelect = (category: CategoryItemType) => {
    setSelectedCategory((prev) => (prev?.id === category.id ? null : category))
  }

  const handleRoomNameChange = (value: string) => {
    setRoomName(value)
  }

  const handleRoomNameBlur = () => {
    setRoomName((prev) => normalizeRoomNameBoundarySpaces(prev))
  }

  // "다음/방 만들기" 클릭 핸들러
  const handleCreateButtonClick = async () => {
    // 1단계에서는 2단계(방 이름 입력)로만 전환하고 종료
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

    if (!createdRoom) {
      toast.error(CREATE_ROOM_ERROR_MESSAGE)
      return
    }

    setCurrentRoomId(createdRoom.room.id)

    // 서버 상태가 OPEN이면 상대 입장 전 대기 상태를 켠다.
    if (createdRoom.status === 'OPEN' && !isWaiting) {
      setIsWaiting(true)
    }
  }

  const handleExitConfirm = async () => {
    const roomId = currentRoomId

    if (roomId) {
      if (!accessToken) {
        toast.error(EXIT_ROOM_ERROR_MESSAGE)
        return false
      }

      const isExited = await exitPvPRoom(accessToken, roomId)
      if (!isExited) {
        toast.error(EXIT_ROOM_ERROR_MESSAGE)
        return false
      }

      // 방 나가기 성공 후 세션 해제 이벤트를 서버에 보낸다.
      publishRoomAction(roomId, UNREGISTER_SESSION_ACTION, JSON.stringify({}))
    }

    // 소켓 구독/연결 정리
    await cleanupConnection()
    // 로컬 room/session 상태 초기화
    setCurrentRoomId(null)
    setIsWaiting(false)
    setIsComplete(false)

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

'use client'

// 페이지 라우팅(생성 성공 후 매칭 페이지 이동, 뒤로가기 fallback 이동)
import { useRouter } from 'next/navigation'
// React 훅(핸들러 메모이제이션/부모 동기화 effect/local state)
import { useCallback, useEffect, useState } from 'react'
// 토스트 알림
import { toast } from 'sonner'

// 방 생성 API
import { createPvPRoom } from '@/entities/room'
// access token 읽기
import { useAccessToken } from '@/features/auth'

import type { CategoryItemType } from '@/entities/category'

// 생성 실패 시 사용자에게 보여줄 메시지
const CREATE_ROOM_ERROR_MESSAGE = '방을 만들던 중 오류가 발생하였습니다.'
// 생성 성공 후 이동할 경로 prefix
const MATCHING_PATH_PREFIX = '/pvp/matching'
// 방 이름 최대 길이
const MAX_ROOM_NAME_LENGTH = 10

// 방 이름 앞/뒤 공백 제거 유틸(중간 공백은 유지)
const normalizeRoomNameBoundarySpaces = (value: string) => value.trim()

type UsePvPMatchingCreateFlowParams = {
  // 부모 페이지에 생성 진행 상태 전달(헤더 back 비활성화)
  onCreatingRoomChange?: (isCreatingRoom: boolean) => void
  // 부모 페이지 헤더가 실행할 뒤로가기 핸들러 등록
  onBackHandlerChange?: (onBackHandler: () => void) => void
}

type UsePvPMatchingCreateFlowResult = {
  selectedCategory: CategoryItemType | null
  isCategoryStep: boolean
  roomName: string
  // create API 진행 중 여부
  isCreatingRoom: boolean
  // 버튼 비활성 여부(입력 미완료 or 생성 중)
  isCreateButtonDisabled: boolean
  createButtonVariant: 'category' | 'create'
  handleCategorySelect: (category: CategoryItemType) => void
  handleRoomNameChange: (value: string) => void
  // 방 이름 blur 시 정규화
  handleRoomNameBlur: () => void
  // 헤더 뒤로가기 클릭 시 호출할 핸들러
  handleBackClick: () => void
  // 다음/방 만들기 버튼 클릭 핸들러
  handleCreateButtonClick: () => Promise<void>
}

export function usePvPMatchingCreateFlow({
  onCreatingRoomChange,
  onBackHandlerChange,
}: UsePvPMatchingCreateFlowParams = {}): UsePvPMatchingCreateFlowResult {
  const [selectedCategory, setSelectedCategory] = useState<CategoryItemType | null>(null)
  const [roomName, setRoomName] = useState('')

  // 단계 전환 상태(null/false: 1단계, true: 2단계)
  const [isNextClicked, setIsNextClicked] = useState<boolean | null>(null)

  // 생성 요청 진행 중 상태(중복 호출 방지 + UI 잠금)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const router = useRouter()
  const accessToken = useAccessToken()

  const hasSelectedCategory = Boolean(selectedCategory)
  const isCategoryStep = !isNextClicked
  const normalizedRoomName = normalizeRoomNameBoundarySpaces(roomName)
  const isRoomNameEmpty = normalizedRoomName.length === 0
  const isRoomNameTooLong = normalizedRoomName.length > MAX_ROOM_NAME_LENGTH

  const createButtonVariant = isCategoryStep ? 'category' : 'create'

  // 단계별 유효성 검증:
  // - 1단계: 카테고리 필수
  // - 2단계: trim 기준 방 이름 필수 + 10자 이하
  const isFormInvalid = isCategoryStep ? !hasSelectedCategory : isRoomNameEmpty || isRoomNameTooLong
  // 버튼 비활성 최종 조건
  const isCreateButtonDisabled = isFormInvalid || isCreatingRoom

  // 카테고리 선택 핸들러: 같은 항목 재클릭 시 해제
  const handleCategorySelect = useCallback((category: CategoryItemType) => {
    setSelectedCategory((prev) => (prev?.id === category.id ? null : category))
  }, [])

  const handleRoomNameChange = useCallback((value: string) => {
    setRoomName(value)
  }, [])

  // 포커스 아웃 시 방 이름 정규화(앞/뒤 공백 제거)
  const handleRoomNameBlur = useCallback(() => {
    setRoomName((prev) => normalizeRoomNameBoundarySpaces(prev))
  }, [])

  // 뒤로가기 규칙:
  // 1) 카테고리 미선택 -> /pvp 이동
  // 2) 카테고리 선택 + 방 이름 미입력 -> 카테고리 선택 해제
  // 3) 카테고리 선택 + 방 이름 입력 -> 방 이름 + 카테고리 선택 모두 초기화
  // 헤더 뒤로가기 핸들러
  const handleBackClick = useCallback(() => {
    // 생성 중에는 뒤로가기 동작을 막는다.
    if (isCreatingRoom) return

    // 아직 카테고리를 선택하지 않았으면 목록(/pvp)으로 이동
    if (!selectedCategory) {
      router.replace('/pvp')
      return
    }

    // 카테고리는 선택했지만 방 이름이 비어 있으면 카테고리 선택 해제
    if (isRoomNameEmpty) {
      setSelectedCategory(null)
      setIsNextClicked(null)
      return
    }

    // 카테고리/방 이름을 모두 초기화해 1단계로 복귀
    setRoomName('')
    setSelectedCategory(null)
    setIsNextClicked(null)
  }, [isCreatingRoom, isRoomNameEmpty, router, selectedCategory])

  // 생성 진행 상태를 부모 페이지와 동기화(헤더 back 비활성화에 사용)
  useEffect(() => {
    onCreatingRoomChange?.(isCreatingRoom)
  }, [isCreatingRoom, onCreatingRoomChange])

  // 부모 페이지 헤더가 실행할 뒤로가기 핸들러를 등록
  useEffect(() => {
    onBackHandlerChange?.(handleBackClick)
  }, [handleBackClick, onBackHandlerChange])

  // 다음/방 만들기 버튼 클릭 핸들러
  const handleCreateButtonClick = async () => {
    // 1단계에서는 API 호출 없이 2단계로 전환만 수행
    if (!isNextClicked) {
      setIsNextClicked(true)
      return
    }

    if (!accessToken || !selectedCategory) return

    // 방 이름 정규화
    if (isRoomNameEmpty || isRoomNameTooLong) return

    // 생성 요청 중복 방지
    if (isCreatingRoom) return

    // 요청 시작(버튼/뒤로가기 비활성화)
    setIsCreatingRoom(true)

    const createdRoom = await createPvPRoom(accessToken, {
      categoryId: selectedCategory.id,
      roomName: normalizedRoomName,
    })

    if (!createdRoom) {
      toast.error(CREATE_ROOM_ERROR_MESSAGE)
      setIsCreatingRoom(false)
      return
    }

    // 생성 성공: 매칭 페이지로 즉시 이동
    router.replace(`${MATCHING_PATH_PREFIX}/${createdRoom.room.id}`)
  }

  return {
    selectedCategory,
    isCategoryStep,
    roomName,
    isCreatingRoom,
    isCreateButtonDisabled,
    createButtonVariant,
    handleCategorySelect,
    handleRoomNameChange,
    handleRoomNameBlur,
    handleBackClick,
    handleCreateButtonClick,
  }
}

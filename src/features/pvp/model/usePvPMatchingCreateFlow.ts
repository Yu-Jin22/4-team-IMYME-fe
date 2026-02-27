'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { createPvPRoom } from '@/entities/room'
import { useAccessToken } from '@/features/auth'

import type { CategoryItemType } from '@/entities/category'

const CREATE_ROOM_ERROR_MESSAGE = '방을 만들던 중 오류가 발생하였습니다.'
const MATCHING_PATH_PREFIX = '/pvp/matching'

const normalizeRoomNameBoundarySpaces = (value: string) => value.trim()

type UsePvPMatchingCreateFlowParams = {
  onCreatingRoomChange?: (isCreatingRoom: boolean) => void
  onBackHandlerChange?: (onBackHandler: () => void) => void
  onExitConfirm?: () => void
}

type UsePvPMatchingCreateFlowResult = {
  selectedCategory: CategoryItemType | null
  // 카테고리 단계 -> 방 이름 단계 전환 여부
  isNextClicked: boolean | null
  isCategoryStep: boolean
  roomName: string
  isCreatingRoom: boolean
  isCreateButtonDisabled: boolean
  createButtonVariant: 'category' | 'create'
  handleCategorySelect: (category: CategoryItemType) => void
  handleRoomNameChange: (value: string) => void
  handleRoomNameBlur: () => void
  handleBackClick: () => void
  handleCreateButtonClick: () => Promise<void>
  handleExitConfirm: () => Promise<boolean>
  handleAlertExitConfirm: () => Promise<void>
}

export function usePvPMatchingCreateFlow({
  onCreatingRoomChange,
  onBackHandlerChange,
  onExitConfirm,
}: UsePvPMatchingCreateFlowParams = {}): UsePvPMatchingCreateFlowResult {
  // 사용자가 선택한 카테고리(1단계)
  const [selectedCategory, setSelectedCategory] = useState<CategoryItemType | null>(null)
  // 1단계(카테고리)에서 2단계(방 이름 입력)로 넘어갔는지 표시
  const [isNextClicked, setIsNextClicked] = useState<boolean | null>(null)
  // 방 이름 입력값(2단계)
  const [roomName, setRoomName] = useState('')
  // createPvPRoom 요청 진행 상태 (중복 클릭 방지 + UI 비활성화 용도)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const router = useRouter()
  const accessToken = useAccessToken()

  // 1단계 유효성: 카테고리가 선택되었는지
  const hasSelectedCategory = Boolean(selectedCategory)
  // 아직 "다음"을 누르지 않았으면 카테고리 단계
  const isCategoryStep = !isNextClicked

  // 버튼 라벨/의미는 현재 단계에 맞춰 category -> create 로만 사용
  const createButtonVariant = isCategoryStep ? 'category' : 'create'

  // 단계별 필수 입력값 검증:
  // - 1단계: 카테고리 필수
  // - 2단계: trim 기준 방 이름 필수
  const isFormInvalid = isCategoryStep ? !hasSelectedCategory : roomName.trim().length === 0
  // 최종 버튼 비활성 조건 (입력 미완료 또는 생성 요청 진행 중)
  const isCreateButtonDisabled = isFormInvalid || isCreatingRoom

  const handleCategorySelect = useCallback((category: CategoryItemType) => {
    setSelectedCategory((prev) => (prev?.id === category.id ? null : category))
  }, [])

  const handleRoomNameChange = useCallback((value: string) => {
    setRoomName(value)
  }, [])

  const handleRoomNameBlur = useCallback(() => {
    setRoomName((prev) => normalizeRoomNameBoundarySpaces(prev))
  }, [])

  // 뒤로가기 규칙:
  // 1) 카테고리 미선택 -> /pvp 이동
  // 2) 카테고리 선택 + 방 이름 미입력 -> 카테고리 선택 해제
  // 3) 카테고리 선택 + 방 이름 입력 -> 방 이름 + 카테고리 선택 모두 초기화
  const handleBackClick = useCallback(() => {
    if (isCreatingRoom) return

    if (!selectedCategory) {
      router.replace('/pvp')
      return
    }

    if (roomName.trim().length === 0) {
      setSelectedCategory(null)
      setIsNextClicked(null)
      router.replace('/pvp')
      return
    }

    setRoomName('')
    setSelectedCategory(null)
    setIsNextClicked(null)
  }, [isCreatingRoom, roomName, router, selectedCategory])

  // 부모 페이지와 생성 진행 상태를 동기화한다.
  useEffect(() => {
    onCreatingRoomChange?.(isCreatingRoom)
  }, [isCreatingRoom, onCreatingRoomChange])

  // 부모 페이지 헤더가 사용할 뒤로가기 핸들러를 등록한다.
  useEffect(() => {
    onBackHandlerChange?.(handleBackClick)
  }, [handleBackClick, onBackHandlerChange])

  // "다음/방 만들기" 클릭 핸들러
  const handleCreateButtonClick = async () => {
    // 1단계에서는 API 호출 없이 2단계 UI로만 전환
    if (!isNextClicked) {
      setIsNextClicked(true)
      return
    }

    // 2단계에서 필수 선행값이 없으면 요청하지 않는다.
    if (!accessToken || !selectedCategory) return

    // 서버에 보낼 값은 앞/뒤 공백을 제거한 방 이름으로 정규화
    const normalizedRoomName = normalizeRoomNameBoundarySpaces(roomName)
    if (normalizedRoomName.length === 0) return

    if (isCreatingRoom) return

    // 요청 시작 시 즉시 비활성화
    setIsCreatingRoom(true)

    // 방 생성 API 호출
    const createdRoom = await createPvPRoom(accessToken, {
      categoryId: selectedCategory.id,
      roomName: normalizedRoomName,
    })

    // 생성 실패 시 라우팅하지 않고 사용자에게 오류를 알린다.
    if (!createdRoom) {
      toast.error(CREATE_ROOM_ERROR_MESSAGE)
      setIsCreatingRoom(false)
      return
    }

    // 2안: 생성 직후 대기 페이지를 거치지 않고 매칭 페이지로 즉시 이동
    router.replace(`${MATCHING_PATH_PREFIX}/${createdRoom.room.id}`)
  }

  const handleExitConfirm = useCallback(async () => {
    return true
  }, [])

  const handleAlertExitConfirm = useCallback(async () => {
    const isExitSuccess = await handleExitConfirm()
    if (!isExitSuccess) return
    onExitConfirm?.()
  }, [handleExitConfirm, onExitConfirm])

  return {
    selectedCategory,
    isNextClicked,
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
    handleExitConfirm,
    handleAlertExitConfirm,
  }
}

'use client'

import { useAccessToken } from '@/features/auth'
import {
  RoomCategorySelect,
  RoomCreateButton,
  RoomNameSetting,
  usePvPMatchingCreateFlow,
} from '@/features/pvp'

type PvPMatchingCreateProps = {
  // 부모 페이지에 "방 생성 진행 중" 상태를 알림(헤더 뒤로가기 비활성화)
  onCreatingRoomChange?: (isCreatingRoom: boolean) => void
  // 부모 페이지 헤더가 사용할 뒤로가기 핸들러를 등록
  onBackHandlerChange?: (onBackHandler: () => void) => void
}

export function PvPMatchingCreate({
  onCreatingRoomChange,
  onBackHandlerChange,
}: PvPMatchingCreateProps) {
  const accessToken = useAccessToken()

  // 생성 플로우의 상태/액션을 훅에서 가져온다.
  // (카테고리 단계 -> 방 이름 단계 -> create API -> matching 페이지 이동)
  const {
    selectedCategory,
    // true면 카테고리 단계, false면 방 이름 단계
    isCategoryStep,
    roomName,
    // 입력값/요청 상태를 반영한 버튼 비활성 여부
    isCreateButtonDisabled,
    createButtonVariant,
    handleCategorySelect,
    handleRoomNameChange,
    // 방 이름 blur 시 앞뒤 공백 정규화
    handleRoomNameBlur,
    // 다음/방 만들기 버튼 클릭
    handleCreateButtonClick,
  } = usePvPMatchingCreateFlow({
    // 생성 진행 상태를 부모로 올린다.
    onCreatingRoomChange,
    // 헤더 뒤로가기 핸들러를 부모에 등록한다.
    onBackHandlerChange,
  })

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* 단계별 렌더링:
          - 카테고리 단계: 카테고리 선택 UI
          - 방 이름 단계: 방 이름 입력 UI */}
      {isCategoryStep ? (
        <RoomCategorySelect
          accessToken={accessToken}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
      ) : (
        <RoomNameSetting
          selectedCategoryName={selectedCategory?.categoryName}
          roomName={roomName}
          onRoomNameChange={handleRoomNameChange}
          onRoomNameBlur={handleRoomNameBlur}
        />
      )}
      <RoomCreateButton
        variant={createButtonVariant}
        disabled={isCreateButtonDisabled}
        onClick={handleCreateButtonClick}
      />
    </div>
  )
}

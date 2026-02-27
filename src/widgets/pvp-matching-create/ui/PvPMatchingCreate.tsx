'use client'

import { useAccessToken } from '@/features/auth'
import {
  RoomCategorySelect,
  RoomCreateButton,
  RoomNameSetting,
  usePvPMatchingCreateFlow,
} from '@/features/pvp'
import { AlertModal } from '@/shared'

type PvPMatchingCreateProps = {
  onCreatingRoomChange?: (isCreatingRoom: boolean) => void
  onBackHandlerChange?: (onBackHandler: () => void) => void
  isExitAlertOpen?: boolean
  onExitAlertOpenChange?: (open: boolean) => void
  onExitConfirm?: () => void
  onExitCancel?: () => void
}

export function PvPMatchingCreate({
  onCreatingRoomChange,
  onBackHandlerChange,
  isExitAlertOpen,
  onExitAlertOpenChange,
  onExitConfirm,
  onExitCancel,
}: PvPMatchingCreateProps) {
  const accessToken = useAccessToken()

  // 매칭 생성 플로우 상태/핸들러(카테고리 선택 -> 방 이름 입력 -> 생성 후 매칭 페이지 이동)
  const {
    selectedCategory,
    isCategoryStep,
    roomName,
    isCreateButtonDisabled,
    createButtonVariant,
    handleCategorySelect,
    handleRoomNameChange,
    handleRoomNameBlur,
    handleCreateButtonClick,
    handleAlertExitConfirm,
  } = usePvPMatchingCreateFlow({
    onCreatingRoomChange,
    onBackHandlerChange,
    onExitConfirm,
  })

  return (
    <div className="flex w-full flex-1 flex-col">
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
      <AlertModal
        open={isExitAlertOpen}
        onOpenChange={onExitAlertOpenChange}
        title={'매칭을 취소하시겠습니까?'}
        description={'현재 진행 중인 매칭이 취소됩니다.'}
        action={'나가기'}
        cancel={'계속하기'}
        onAction={handleAlertExitConfirm}
        onCancel={onExitCancel}
      />
    </div>
  )
}

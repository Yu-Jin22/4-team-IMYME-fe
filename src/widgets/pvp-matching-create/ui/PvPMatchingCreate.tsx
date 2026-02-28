'use client'

// 토큰을 읽어 카테고리 API 요청 등에 전달
import { useAccessToken } from '@/features/auth'
// 생성 화면을 구성하는 UI/플로우 훅
import {
  RoomCategorySelect,
  RoomCreateButton,
  RoomNameSetting,
  usePvPMatchingCreateFlow,
} from '@/features/pvp'
// 생성 취소 확인 모달
import { AlertModal } from '@/shared'

type PvPMatchingCreateProps = {
  // 부모 페이지에 "방 생성 진행 중" 상태를 알림(헤더 뒤로가기 비활성화)
  onCreatingRoomChange?: (isCreatingRoom: boolean) => void
  // 부모 페이지 헤더가 사용할 뒤로가기 핸들러를 등록
  onBackHandlerChange?: (onBackHandler: () => void) => void
  // 외부에서 제어하는 나가기 모달 open 상태
  isExitAlertOpen?: boolean
  // 외부에서 제어하는 나가기 모달 open 변경 핸들러
  onExitAlertOpenChange?: (open: boolean) => void
  // 모달의 "나가기"가 최종 성공했을 때 부모 후처리
  onExitConfirm?: () => void
  // 모달의 "계속하기/닫기" 핸들러
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
  // 카테고리 조회 컴포넌트에 전달할 access token
  const accessToken = useAccessToken()

  // 생성 플로우의 상태/액션을 훅에서 가져온다.
  // (카테고리 단계 -> 방 이름 단계 -> create API -> matching 페이지 이동)
  const {
    // 현재 선택된 카테고리(없으면 null)
    selectedCategory,
    // true면 카테고리 단계, false면 방 이름 단계
    isCategoryStep,
    // 방 이름 입력값
    roomName,
    // 입력값/요청 상태를 반영한 버튼 비활성 여부
    isCreateButtonDisabled,
    // 버튼 variant(category/create)
    createButtonVariant,
    // 카테고리 선택 토글
    handleCategorySelect,
    // 방 이름 입력 변경
    handleRoomNameChange,
    // 방 이름 blur 시 앞뒤 공백 정규화
    handleRoomNameBlur,
    // 다음/방 만들기 버튼 클릭
    handleCreateButtonClick,
    // 모달의 나가기 클릭 처리(훅 내부에서 성공 여부 처리 후 부모 콜백 호출)
    handleAlertExitConfirm,
  } = usePvPMatchingCreateFlow({
    // 생성 진행 상태를 부모로 올린다.
    onCreatingRoomChange,
    // 헤더 뒤로가기 핸들러를 부모에 등록한다.
    onBackHandlerChange,
    // 이탈 성공 후 부모 후처리를 수행한다.
    onExitConfirm,
  })

  return (
    // 생성 위젯 루트 레이아웃
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
      {/* 하단 CTA 버튼(다음/방 만들기) */}
      <RoomCreateButton
        variant={createButtonVariant}
        disabled={isCreateButtonDisabled}
        onClick={handleCreateButtonClick}
      />
      {/* 생성 취소(나가기) 확인 모달 */}
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

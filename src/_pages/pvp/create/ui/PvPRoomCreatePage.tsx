'use client'

// Next App Router에서 페이지 이동을 제어하는 훅
import { useRouter } from 'next/navigation'
// React 훅: 메모이제이션 콜백/가변 ref/local state
import { useCallback, useRef, useState } from 'react'

// 생성 페이지 이탈(나가기 모달) 관련 훅
import { usePvPRoomCreateExitGuard } from '@/features/pvp'
// 상단 모드 헤더 UI
import { ModeHeader } from '@/shared'
// 실제 생성 폼/플로우 위젯
import { PvPMatchingCreate } from '@/widgets/pvp-matching-create'

export function PvPRoomCreatePage() {
  // create API 진행 중 여부(헤더 뒤로가기 비활성화 용도)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  // 생성 위젯이 제공하는 "현재 단계용 뒤로가기 핸들러"를 페이지에서 보관
  const createPageBackHandlerRef = useRef<(() => void) | null>(null)
  // 기본 라우팅 fallback(/pvp) 처리용 router
  const router = useRouter()
  // 나가기 모달 open/close와 확인/취소 핸들러
  const { isExitAlertOpen, handleExitCancel, handleExitConfirm, setIsExitAlertOpen } =
    usePvPRoomCreateExitGuard()

  // 헤더 뒤로가기 클릭 시 실행:
  // 1) 생성 위젯이 등록한 단계별 뒤로가기 핸들러가 있으면 그걸 우선 실행
  // 2) 없으면 /pvp로 이동
  const handleHeaderBack = useCallback(() => {
    if (createPageBackHandlerRef.current) {
      createPageBackHandlerRef.current()
      return
    }

    router.replace('/pvp')
  }, [router])

  // 하위 위젯이 넘겨준 뒤로가기 핸들러를 ref에 저장
  // (함수 참조가 바뀌어도 헤더는 최신 핸들러를 실행할 수 있게 유지)
  const handleCreatePageBackHandlerChange = useCallback((onBackHandler: () => void) => {
    createPageBackHandlerRef.current = onBackHandler
  }, [])

  return (
    // 페이지 루트 레이아웃
    <div className="flex w-full flex-1 flex-col">
      {/* PvP 생성 헤더: 생성 중에는 뒤로가기 비활성화 */}
      <ModeHeader
        mode="pvp"
        step="matching_create"
        onBack={handleHeaderBack}
        backDisabled={isCreatingRoom}
      />
      {/* 생성 위젯: 생성 진행 상태/뒤로가기 핸들러/이탈 모달 상태를 페이지와 동기화 */}
      <PvPMatchingCreate
        onCreatingRoomChange={setIsCreatingRoom}
        onBackHandlerChange={handleCreatePageBackHandlerChange}
        isExitAlertOpen={isExitAlertOpen}
        onExitAlertOpenChange={setIsExitAlertOpen}
        onExitConfirm={handleExitConfirm}
        onExitCancel={handleExitCancel}
      />
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type PvPRoomCreateExitGuardResult = {
  isExitAlertOpen: boolean
  handleBack: () => void
  handleExitConfirm: () => void
  handleExitCancel: () => void
  setIsExitAlertOpen: (open: boolean) => void
}

/*
  PvP 룸 생성 페이지 exit guard
  - 현재 구조에서는 뒤로가기 시 이전 페이지로 즉시 이동
  - AlertModal 상태는 외부 제어와의 호환을 위해 유지
*/
export function usePvPRoomCreateExitGuard(): PvPRoomCreateExitGuardResult {
  // 뒤로가기 모달 상태
  const [isExitAlertOpen, setIsExitAlertOpen] = useState(false)
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  const handleExitConfirm = () => {
    setIsExitAlertOpen(false)
    router.replace('/pvp')
  }

  const handleExitCancel = () => {
    setIsExitAlertOpen(false)
  }

  return {
    isExitAlertOpen,
    handleBack,
    handleExitConfirm,
    handleExitCancel,
    setIsExitAlertOpen,
  }
}

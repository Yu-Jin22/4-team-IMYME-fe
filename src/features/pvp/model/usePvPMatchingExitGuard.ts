'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { exitPvPRoom } from '@/entities/room'

const EXIT_ROOM_ERROR_MESSAGE = '매칭을 종료하던 중 오류가 발생하였습니다.'
const EXIT_ROOM_PATH = '/pvp'

type UsePvPMatchingExitGuardParams = {
  joinedRoomId: number | null
  cleanupMatchingConnection: () => Promise<void>
}

type UsePvPMatchingExitGuardResult = {
  isExitAlertOpen: boolean
  isExitingRoom: boolean
  handleBack: () => void
  handleExitConfirm: () => Promise<void>
  handleExitCancel: () => void
  setIsExitAlertOpen: (open: boolean) => void
}

export function usePvPMatchingExitGuard({
  joinedRoomId,
  cleanupMatchingConnection,
}: UsePvPMatchingExitGuardParams): UsePvPMatchingExitGuardResult {
  const router = useRouter()
  const [isExitAlertOpen, setIsExitAlertOpen] = useState(false)
  const [isExitingRoom, setIsExitingRoom] = useState(false)

  const handleBack = () => {
    setIsExitAlertOpen(true)
  }

  const handleExitConfirm = async () => {
    if (isExitingRoom) return

    setIsExitingRoom(true)

    if (joinedRoomId) {
      const isExited = await exitPvPRoom(joinedRoomId)
      if (!isExited) {
        setIsExitingRoom(false)
        toast.error(EXIT_ROOM_ERROR_MESSAGE)
        return
      }
    }

    setIsExitAlertOpen(false)
    await cleanupMatchingConnection()
    setIsExitingRoom(false)
    router.replace(EXIT_ROOM_PATH)
  }

  const handleExitCancel = () => {
    setIsExitAlertOpen(false)
  }

  return {
    isExitAlertOpen,
    isExitingRoom,
    handleBack,
    handleExitConfirm,
    handleExitCancel,
    setIsExitAlertOpen,
  }
}

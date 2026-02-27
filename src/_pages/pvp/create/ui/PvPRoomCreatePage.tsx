'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

import { usePvPRoomCreateExitGuard } from '@/features/pvp'
import { ModeHeader } from '@/shared'
import { PvPMatchingCreate } from '@/widgets/pvp-matching-create'

export function PvPRoomCreatePage() {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const createPageBackHandlerRef = useRef<(() => void) | null>(null)
  const router = useRouter()
  const { isExitAlertOpen, handleExitCancel, handleExitConfirm, setIsExitAlertOpen } =
    usePvPRoomCreateExitGuard()

  const handleHeaderBack = useCallback(() => {
    if (createPageBackHandlerRef.current) {
      createPageBackHandlerRef.current()
      return
    }

    router.replace('/pvp')
  }, [router])

  const handleCreatePageBackHandlerChange = useCallback((onBackHandler: () => void) => {
    createPageBackHandlerRef.current = onBackHandler
  }, [])

  return (
    <div className="flex w-full flex-1 flex-col">
      <ModeHeader
        mode="pvp"
        step="matching_create"
        onBack={handleHeaderBack}
        backDisabled={isCreatingRoom}
      />
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

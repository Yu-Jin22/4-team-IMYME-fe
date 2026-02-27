'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { deleteCard } from '@/entities/card'
import { useAccessToken } from '@/features/auth'
import { deleteAttempt } from '@/features/levelup-feedback'

const FIRST_ATTEMPT_NO = 1

type UseLevelUpRecordExitGuardResult = {
  isBackAlertOpen: boolean
  handleBackConfirm: () => Promise<void>
  handleBackCancel: () => void
  handleBackAlertOpenChange: (open: boolean) => void
}

export function useLevelUpRecordExitGuard(): UseLevelUpRecordExitGuardResult {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessToken = useAccessToken()
  const [isBackAlertOpen, setIsBackAlertOpen] = useState(false)

  const cardId = Number(searchParams.get('cardId'))
  const attemptNo = Number(searchParams.get('attemptNo'))
  const attemptId = Number(searchParams.get('attemptId'))

  const handleBackConfirm = async () => {
    setIsBackAlertOpen(false)

    if (accessToken && cardId && attemptId && attemptNo !== FIRST_ATTEMPT_NO) {
      await deleteAttempt(accessToken, cardId, attemptId)
      router.push('/main')
      return
    }

    if (accessToken && cardId) {
      await deleteCard(accessToken, cardId)
    }
    router.push('/main')
  }

  const handleBackCancel = () => {
    setIsBackAlertOpen(false)
  }

  const handleBackAlertOpenChange = (open: boolean) => {
    setIsBackAlertOpen(open)
  }

  return {
    isBackAlertOpen,
    handleBackConfirm,
    handleBackCancel,
    handleBackAlertOpenChange,
  }
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useRecordController } from '@/features/record'

import type { FeedbackStatus } from '@/features/levelup-feedback'

type UseChallengeRecordControllerResult = {
  isSubmittingFeedback: boolean
  uploadStatus: FeedbackStatus | null
  isStartingWarmup: boolean
  warmupError: boolean
  isMicAlertOpen: boolean
  isRecording: boolean
  isPaused: boolean
  recordedBlob: Blob | null
  canSubmitRecording: boolean
  handleMicClick: () => Promise<void>
  handleMicAlertOpenChange: (open: boolean) => void
  getElapsedSeconds: () => number
  handleRecordingComplete: () => Promise<void>
}

const MINIMUM_SUBMIT_DURATION_SECONDS = 1
const TOO_SHORT_RECORDING_ERROR_MESSAGE = '1초 이상 녹음한 뒤 제출해주세요.'
const MS_PER_SECOND = 1_000

export function useChallengeRecordController(): UseChallengeRecordControllerResult {
  const {
    isMicAlertOpen,
    isRecording,
    isPaused,
    getElapsedSeconds,
    recordedBlob,
    handleMicClick: handleBaseMicClick,
    handleMicAlertOpenChange,
    stopRecordingAndGetBlob,
  } = useRecordController({ canPause: false })

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [uploadStatus] = useState<FeedbackStatus | null>(null)
  const [isStartingWarmup] = useState(false)
  const [warmupError] = useState(false)
  const [canSubmitRecording, setCanSubmitRecording] = useState(false)

  useEffect(() => {
    if (!isRecording) {
      setCanSubmitRecording(false)
      return
    }

    setCanSubmitRecording(false)
    const enableTimerId = window.setTimeout(() => {
      setCanSubmitRecording(true)
    }, MINIMUM_SUBMIT_DURATION_SECONDS * MS_PER_SECOND)

    return () => {
      window.clearTimeout(enableTimerId)
    }
  }, [isRecording])

  const handleMicClick = useCallback(async () => {
    if (isRecording) return
    await handleBaseMicClick()
  }, [handleBaseMicClick, isRecording])

  const handleRecordingComplete = useCallback(async () => {
    if (!isRecording || isSubmittingFeedback) return
    const durationSeconds = getElapsedSeconds()
    if (durationSeconds < MINIMUM_SUBMIT_DURATION_SECONDS) {
      toast.error(TOO_SHORT_RECORDING_ERROR_MESSAGE)
      return
    }

    setIsSubmittingFeedback(true)
    try {
      await stopRecordingAndGetBlob()
    } finally {
      setIsSubmittingFeedback(false)
    }
  }, [getElapsedSeconds, isRecording, isSubmittingFeedback, stopRecordingAndGetBlob])

  return {
    isSubmittingFeedback,
    uploadStatus,
    isStartingWarmup,
    warmupError,
    isMicAlertOpen,
    isRecording,
    isPaused,
    recordedBlob,
    canSubmitRecording,
    handleMicClick,
    handleMicAlertOpenChange,
    getElapsedSeconds,
    handleRecordingComplete,
  }
}

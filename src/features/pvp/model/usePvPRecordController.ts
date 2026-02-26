'use client'

import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useRecordController } from '@/features/record'

import { startPvPRecording } from '../api/startPvPRecording'

const THINKING_ROOM_STATUS = 'THINKING'
const RECORDING_ROOM_STATUS = 'RECORDING'
const START_RECORDING_ERROR_MESSAGE = '녹음 시작 요청에 실패했습니다. 다시 시도해주세요.'

type UsePvPRecordControllerParams = {
  accessToken: string | null
  roomId: number | null
  roomStatus: string | null
}

type UsePvPRecordControllerResult = {
  isStartingWarmup: boolean
  warmupError: boolean
  isRecording: boolean
  isPaused: boolean
  elapsedSeconds: number
  recordedBlob: Blob | null
  isMicInteractionAllowed: boolean
  handlePvPMicClick: () => Promise<void>
}

export function usePvPRecordController({
  accessToken,
  roomId,
  roomStatus,
}: UsePvPRecordControllerParams): UsePvPRecordControllerResult {
  const isStartingLocalRecordingRef = useRef(false)
  const {
    isStartingWarmup,
    warmupError,
    handleMicClick,
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlob,
  } = useRecordController()

  const isThinkingStep = roomStatus === THINKING_ROOM_STATUS
  const isRecordingStep = roomStatus === RECORDING_ROOM_STATUS
  const isMicInteractionAllowed = isThinkingStep || isRecordingStep || isRecording

  const startLocalRecordingIfNeeded = useCallback(async () => {
    if (isRecording || Boolean(recordedBlob)) return
    if (isStartingLocalRecordingRef.current) return

    isStartingLocalRecordingRef.current = true
    try {
      await handleMicClick()
    } finally {
      isStartingLocalRecordingRef.current = false
    }
  }, [handleMicClick, isRecording, recordedBlob])

  const handlePvPMicClick = async () => {
    if (isRecording) {
      await handleMicClick()
      return
    }

    if (isThinkingStep) {
      if (!accessToken || !roomId) return

      const startRecordingResult = await startPvPRecording(accessToken, roomId)
      if (!startRecordingResult.ok) {
        toast.error(START_RECORDING_ERROR_MESSAGE)
        return
      }

      await startLocalRecordingIfNeeded()
      return
    }

    if (isRecordingStep) {
      await startLocalRecordingIfNeeded()
    }
  }

  useEffect(() => {
    if (!isRecordingStep) return
    void startLocalRecordingIfNeeded()
  }, [isRecordingStep, startLocalRecordingIfNeeded])

  return {
    isStartingWarmup,
    warmupError,
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlob,
    isMicInteractionAllowed,
    handlePvPMicClick,
  }
}

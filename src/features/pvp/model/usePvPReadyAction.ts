'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { startPvPRecording } from '../api/startPvPRecording'

import { PVP_START_RECORDING_ERROR_MESSAGE, THINKING_ROOM_STATUS } from './pvpMatchingConstants'

type UsePvPReadyActionParams = {
  accessToken: string | null
  roomId: number | null
  roomStatus: string | null
  isReadySubmitted: boolean
  setIsReadySubmitted: (nextValue: boolean) => void
  onReadySuccess: (nextStatus: string | null) => void
}

type UsePvPReadyActionResult = {
  isStartingRecordingRequest: boolean
  canStartPvPRecording: boolean
  handleReadyButtonClick: () => Promise<void>
}

export function usePvPReadyAction({
  accessToken,
  roomId,
  roomStatus,
  isReadySubmitted,
  setIsReadySubmitted,
  onReadySuccess,
}: UsePvPReadyActionParams): UsePvPReadyActionResult {
  const [isStartingRecordingRequest, setIsStartingRecordingRequest] = useState(false)

  const canStartPvPRecording =
    roomStatus === THINKING_ROOM_STATUS &&
    Boolean(accessToken) &&
    Boolean(roomId) &&
    !isStartingRecordingRequest &&
    !isReadySubmitted

  const handleReadyButtonClick = useCallback(async () => {
    if (!accessToken || !roomId) return
    if (isReadySubmitted || isStartingRecordingRequest) return

    setIsReadySubmitted(true)
    setIsStartingRecordingRequest(true)

    const startRecordingResult = await startPvPRecording(accessToken, roomId)

    setIsStartingRecordingRequest(false)

    if (!startRecordingResult.ok) {
      setIsReadySubmitted(false)
      toast.error(PVP_START_RECORDING_ERROR_MESSAGE)
      return
    }

    onReadySuccess(startRecordingResult.data.status)
  }, [
    accessToken,
    isReadySubmitted,
    isStartingRecordingRequest,
    onReadySuccess,
    roomId,
    setIsReadySubmitted,
  ])

  return {
    isStartingRecordingRequest,
    canStartPvPRecording,
    handleReadyButtonClick,
  }
}

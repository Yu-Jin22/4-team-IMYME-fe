'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { deleteCard } from '@/entities/card'
import { useAccessToken } from '@/features/auth'
import { startWarmup } from '@/features/levelup'
import { deleteAttempt, useCardDetails } from '@/features/levelup-feedback'

import { completeAudioUpload } from '../api/completeAudioUpload'
import { getAudioUrl } from '../api/getAudioUrl'
import { uploadAudio } from '../api/uploadAudio'

import { useRecordController } from './useRecordController'

import type { FeedbackStatus } from '@/features/levelup-feedback'

const REDIRECT_DELAY_MS = 1500
const DEFAULT_CONTENT_TYPE: SupportedAudioContentType = 'audio/webm'
const AUTO_SUBMIT_DELAY_MS = 0
type SupportedAudioContentType = 'audio/mp4' | 'audio/webm' | 'audio/wav' | 'audio/mpeg'

const MIME_TO_CONTENT_TYPE_MAP: Record<string, SupportedAudioContentType> = {
  'audio/webm': 'audio/webm',
  'audio/mp4': 'audio/mp4',
  'audio/wav': 'audio/wav',
  'audio/mpeg': 'audio/mpeg',
}

type UseLevelUpRecordControllerResult = {
  data: ReturnType<typeof useCardDetails>['data']
  isSubmittingFeedback: boolean
  uploadStatus: FeedbackStatus | null
  isStartingWarmup: boolean
  warmupError: boolean
  isMicAlertOpen: boolean
  isBackAlertOpen: boolean
  isRecording: boolean
  isPaused: boolean
  elapsedSeconds: number
  recordedBlob: Blob | null
  handleMicClick: () => Promise<void>
  handleBackConfirm: () => Promise<void>
  handleBackCancel: () => void
  handleMicAlertOpenChange: (open: boolean) => void
  handleBackAlertOpenChange: (open: boolean) => void
  handleRecordingComplete: () => Promise<void>
}

export function useLevelUpRecordController(): UseLevelUpRecordControllerResult {
  const router = useRouter()
  const searchParams = useSearchParams()

  const cardId = Number(searchParams.get('cardId'))
  const attemptNo = Number(searchParams.get('attemptNo'))
  const attemptId = Number(searchParams.get('attemptId'))
  const accessToken = useAccessToken()
  const { data } = useCardDetails(accessToken, cardId)

  const {
    isMicAlertOpen,
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlob,
    autoStopped,
    handleMicClick: handleBaseMicClick,
    handleMicAlertOpenChange,
    stopRecordingAndGetBlob,
    getDurationSeconds,
    clearRecordedBlob,
    resetAutoStopped,
  } = useRecordController()

  const [isBackAlertOpen, setIsBackAlertOpen] = useState(false)
  const [warmupError, setWarmupError] = useState(false)
  const [isStartingWarmup, setIsStartingWarmup] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<FeedbackStatus | null>(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  useEffect(() => {
    if (!warmupError) return

    const timeoutId = window.setTimeout(() => {
      router.push('/main')
    }, REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [router, warmupError])

  const handleMicClick = async () => {
    if (!accessToken || !cardId) return

    // 녹음 중에는 공통 컨트롤러의 pause/resume 로직을 그대로 사용
    if (isRecording) {
      await handleBaseMicClick()
      return
    }

    setIsStartingWarmup(true)
    const response = await startWarmup(accessToken, { cardId })
    setIsStartingWarmup(false)

    if (!response) {
      setWarmupError(true)
      toast.error('음성 녹음에 실패하였습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    // 워밍업 성공 후 실제 녹음 시작은 공통 컨트롤러에 위임
    await handleBaseMicClick()
  }

  const handleBackConfirm = async () => {
    setIsBackAlertOpen(false)

    if (accessToken && cardId && attemptId && attemptNo !== 1) {
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

  const handleRecordingComplete = useCallback(async () => {
    if (isSubmittingFeedback) return
    if (!accessToken || !cardId || !attemptId) return

    setIsSubmittingFeedback(true)

    const completedBlob = await stopRecordingAndGetBlob()
    if (!completedBlob) {
      setIsSubmittingFeedback(false)
      toast.error('녹음 파일을 생성하던 중 오류가 발생했습니다. 다시 녹음해주세요.')
      return
    }

    const durationSeconds = getDurationSeconds()
    const normalizedMimeType = completedBlob.type.split(';')[0]
    const contentType = MIME_TO_CONTENT_TYPE_MAP[normalizedMimeType] ?? DEFAULT_CONTENT_TYPE

    const audioUrlResult = await getAudioUrl(accessToken, attemptId, contentType)
    if (!audioUrlResult.ok) {
      setIsSubmittingFeedback(false)
      toast.error('오디오 업로드 URL을 가져오지 못했습니다. 다시 시도해주세요.')
      return
    }

    const uploadUrl = audioUrlResult.data?.uploadUrl
    const objectKey = audioUrlResult.data?.objectKey
    const uploadContentType = audioUrlResult.data?.contentType

    if (!uploadUrl || !objectKey || !uploadContentType) {
      setIsSubmittingFeedback(false)
      toast.error('오디오 업로드 정보를 가져오지 못했습니다.')
      return
    }

    const uploadResult = await uploadAudio(uploadUrl, completedBlob, uploadContentType)
    if (!uploadResult.ok) {
      setIsSubmittingFeedback(false)
      toast.error('오디오 업로드에 실패했습니다. 다시 시도해주세요.')
      return
    }

    const completeResult = await completeAudioUpload(
      accessToken,
      cardId,
      attemptId,
      objectKey,
      durationSeconds,
    )
    if (!completeResult.ok) {
      setIsSubmittingFeedback(false)
      toast.error('오디오 업로드에 실패했습니다. 다시 시도해주세요.')
      return
    }

    if (completeResult.data?.status === 'PENDING') {
      setUploadStatus('PENDING')
    }

    clearRecordedBlob()

    const feedbackParams = new URLSearchParams({
      cardId: String(cardId),
      attemptId: String(attemptId),
    })

    if (attemptNo !== null) {
      feedbackParams.set('attemptNo', String(attemptNo))
    }

    router.replace(`/levelup/feedback?${feedbackParams.toString()}`)
  }, [
    accessToken,
    attemptId,
    attemptNo,
    cardId,
    clearRecordedBlob,
    getDurationSeconds,
    isSubmittingFeedback,
    router,
    stopRecordingAndGetBlob,
  ])

  useEffect(() => {
    if (!autoStopped || !recordedBlob || isSubmittingFeedback) return

    resetAutoStopped()

    const timeoutId = window.setTimeout(() => {
      void handleRecordingComplete()
    }, AUTO_SUBMIT_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [autoStopped, handleRecordingComplete, isSubmittingFeedback, recordedBlob, resetAutoStopped])

  return {
    data,
    isSubmittingFeedback,
    uploadStatus,
    isStartingWarmup,
    warmupError,
    isMicAlertOpen,
    isBackAlertOpen,
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlob,
    handleMicClick,
    handleBackConfirm,
    handleBackCancel,
    handleMicAlertOpenChange,
    handleBackAlertOpenChange,
    handleRecordingComplete,
  }
}

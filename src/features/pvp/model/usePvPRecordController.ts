'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useRecordController } from '@/features/record'
import { resolveAudioContentType } from '@/shared'

import { completePvPSubmission } from '../api/completePvPSubmission'
import { createPvPSubmission } from '../api/createPvPSubmission'
import { uploadPvPSubmissionAudio } from '../api/uploadPvPSubmissionAudio'

const RECORDING_ROOM_STATUS = 'RECORDING'

const FILE_NAME_PREFIX = 'pvp-submission'
const FILE_NAME_EXTENSION_WEBM = 'webm'
const FILE_NAME_EXTENSION_MP4 = 'mp4'
const FILE_NAME_EXTENSION_WAV = 'wav'
const FILE_NAME_EXTENSION_MPEG = 'mp3'

const EMPTY_BLOB_ERROR_MESSAGE = '녹음 파일을 생성하지 못했습니다. 다시 시도해주세요.'
const CREATE_SUBMISSION_ERROR_MESSAGE =
  '오디오 업로드 URL을 생성하지 못했습니다. 다시 시도해주세요.'
const UPLOAD_SUBMISSION_ERROR_MESSAGE = '오디오 업로드에 실패했습니다. 다시 시도해주세요.'
const COMPLETE_SUBMISSION_ERROR_MESSAGE =
  '오디오 업로드 완료 처리에 실패했습니다. 다시 시도해주세요.'
const MINIMUM_SUBMIT_DURATION_SECONDS = 1
const TOO_SHORT_RECORDING_ERROR_MESSAGE = '1초 이상 녹음한 뒤 제출해주세요.'

const getFileExtensionFromContentType = (contentType: string) => {
  if (contentType === 'audio/mp4') return FILE_NAME_EXTENSION_MP4
  if (contentType === 'audio/wav') return FILE_NAME_EXTENSION_WAV
  if (contentType === 'audio/mpeg') return FILE_NAME_EXTENSION_MPEG
  return FILE_NAME_EXTENSION_WEBM
}

// 업로드용 파일명을 생성 예: pvp-submission-1700000000000.webm
const buildPvPSubmissionFileName = (contentType: string) => {
  // contentType 기준 확장자 계산
  const extension = getFileExtensionFromContentType(contentType)
  return `${FILE_NAME_PREFIX}-${Date.now()}.${extension}`
}

type UsePvPRecordControllerParams = {
  roomId: number | null
  roomStatus: string | null
}

type UsePvPRecordControllerResult = {
  isRecording: boolean
  isPaused: boolean
  getElapsedSeconds: () => number
  recordedBlob: Blob | null
  // 현재 마이크 클릭 허용 여부
  isMicInteractionAllowed: boolean
  // 서버 제출/업로드 진행 중 여부
  isSubmittingSubmission: boolean
  // 서버 제출 완료 여부(로더 유지용)
  isSubmissionCompleted: boolean
  // 소켓 self ANSWER_SUBMITTED 수신 시 강제로 완료 상태로 표시
  markSubmissionCompleted: () => void
  handlePvPMicClick: () => Promise<void>
}

export function usePvPRecordController({
  roomId,
  roomStatus,
}: UsePvPRecordControllerParams): UsePvPRecordControllerResult {
  // 로컬 녹음 시작 중복 방지 ref
  const isStartingLocalRecordingRef = useRef(false)
  // 제출(생성/업로드/완료) 중복 실행 방지 ref
  const isSubmittingRef = useRef(false)
  // 한 번 제출이 시작되면 같은 녹음 결과에 대한 중복 제출을 막는다.
  const hasSubmittedRef = useRef(false)
  // 제출 진행 상태(state)
  const [isSubmittingSubmission, setIsSubmittingSubmission] = useState(false)
  // 제출 완료 상태(state)
  const [isSubmissionCompleted, setIsSubmissionCompleted] = useState(false)

  const {
    handleMicClick,
    stopRecordingAndGetBlob,
    isRecording,
    isPaused,
    getElapsedSeconds,
    recordedBlob,
    autoStopped,
    resetAutoStopped,
    getDurationSeconds,
  } = useRecordController({ canPause: false })

  // 현재 방 상태가 RECORDING인지
  const isRecordingStep = roomStatus === RECORDING_ROOM_STATUS
  // 녹음 단계이거나 이미 녹음 중이면 마이크 상호작용 허용
  const isMicInteractionAllowed = isRecordingStep || isRecording

  // "아직 녹음이 시작되지 않은 경우에만" 로컬 녹음을 시작한다.
  const startLocalRecordingIfNeeded = useCallback(async () => {
    // 이미 녹음 중이면 시작하지 않는다.
    if (isRecording || Boolean(recordedBlob)) return
    // 시작 중이면 중복 시작하지 않는다.
    if (isStartingLocalRecordingRef.current) return

    // 새 녹음 사이클 시작 시 제출 상태를 초기화
    hasSubmittedRef.current = false
    setIsSubmissionCompleted(false)

    // 시작 중 플래그 on
    isStartingLocalRecordingRef.current = true
    try {
      // 실제 녹음 시작
      await handleMicClick()
    } finally {
      // 시작 중 플래그 off
      isStartingLocalRecordingRef.current = false
    }
  }, [handleMicClick, isRecording, recordedBlob])

  // 제출 공통 플로우: submission 생성 -> 업로드 -> complete
  const submitRecordedBlob = useCallback(
    async (completedBlob: Blob) => {
      if (isSubmittingRef.current || hasSubmittedRef.current) return

      // 제출 중복 방지 플래그 on
      isSubmittingRef.current = true
      hasSubmittedRef.current = true
      // UI 로더 표시 상태 on
      setIsSubmittingSubmission(true)
      let shouldKeepSubmitted = false
      try {
        if (!roomId) {
          toast.error(CREATE_SUBMISSION_ERROR_MESSAGE)
          return
        }

        // blob MIME 타입에서 파라미터를 제거해 기본 MIME으로 정규화
        const normalizedMimeType = completedBlob.type.split(';')[0]
        const contentType = resolveAudioContentType(normalizedMimeType)

        // 1) submission 생성 (presigned upload URL 발급)
        const createSubmissionResult = await createPvPSubmission(roomId, {
          fileName: buildPvPSubmissionFileName(contentType),
          contentType,
          fileSize: completedBlob.size,
        })

        if (!createSubmissionResult.ok) {
          toast.error(CREATE_SUBMISSION_ERROR_MESSAGE)
          return
        }

        // 2) presigned URL에 오디오 PUT 업로드
        const uploadResult = await uploadPvPSubmissionAudio(
          createSubmissionResult.data.uploadUrl,
          completedBlob,
          contentType,
        )

        if (!uploadResult.ok) {
          toast.error(UPLOAD_SUBMISSION_ERROR_MESSAGE)
          return
        }

        // 3) 업로드 완료 후 submission complete 호출
        const durationSeconds = getDurationSeconds()
        const completeSubmissionResult = await completePvPSubmission(
          createSubmissionResult.data.submissionId,
          { durationSeconds },
        )

        if (!completeSubmissionResult.ok) {
          toast.error(COMPLETE_SUBMISSION_ERROR_MESSAGE)
          return
        }

        // complete 성공 시 로더 유지 상태로 전환
        setIsSubmissionCompleted(true)
        shouldKeepSubmitted = true
      } finally {
        // 제출 중복 방지 플래그 off
        isSubmittingRef.current = false
        // 실패한 경우에만 재시도를 허용한다.
        if (!shouldKeepSubmitted) {
          hasSubmittedRef.current = false
        }
        // 제출 로딩 상태 off
        setIsSubmittingSubmission(false)
      }
    },
    [getDurationSeconds, roomId],
  )

  const handlePvPMicClick = async () => {
    if (isSubmittingRef.current) return

    // PvP에서는 녹음 중 클릭 시 "일시정지/재개"가 아니라 "녹음 종료 + 서버 제출"을 수행
    if (isRecording) {
      const completedBlob = await stopRecordingAndGetBlob()
      if (!completedBlob) {
        toast.error(EMPTY_BLOB_ERROR_MESSAGE)
        return
      }

      const durationSeconds = getDurationSeconds()
      if (durationSeconds < MINIMUM_SUBMIT_DURATION_SECONDS) {
        toast.error(TOO_SHORT_RECORDING_ERROR_MESSAGE)
        return
      }

      await submitRecordedBlob(completedBlob)
      // 녹음 종료 분기 처리를 끝냈으므로 반환
      return
    }

    // 아직 녹음 중이 아니고 RECORDING 단계라면 녹음을 시작한다.
    if (isRecordingStep) {
      await startLocalRecordingIfNeeded()
    }
  }

  // 방 상태가 RECORDING으로 바뀌면 자동으로 녹음을 시작
  useEffect(() => {
    // RECORDING 단계가 아니면 자동 시작하지 않는다.
    if (!isRecordingStep) return
    // 비동기 녹음 시작 실행
    void startLocalRecordingIfNeeded()
  }, [isRecordingStep, startLocalRecordingIfNeeded])

  // 60초 auto-stop으로 녹음이 종료된 경우, blob 생성이 완료되면 제출 API를 자동 실행한다.
  useEffect(() => {
    if (!autoStopped) return
    if (!recordedBlob) return

    // auto-stop 플래그는 즉시 소비해 effect 재실행 중복을 막는다.
    resetAutoStopped()

    const submitAfterAutoStop = async () => {
      await submitRecordedBlob(recordedBlob)
    }

    void submitAfterAutoStop()
  }, [autoStopped, recordedBlob, resetAutoStopped, submitRecordedBlob])

  return {
    isRecording,
    isPaused,
    recordedBlob,
    isMicInteractionAllowed,
    isSubmittingSubmission,
    isSubmissionCompleted,
    getElapsedSeconds,
    // 소켓 self ANSWER_SUBMITTED 수신 시 로컬 완료 상태를 동기화한다.
    markSubmissionCompleted: () => {
      setIsSubmissionCompleted(true)
    },
    handlePvPMicClick,
  }
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getChallengeParticipantsStream } from '../api/getChallengeParticipantsStream'

type UseChallengeParticipantsCountStreamParams = {
  challengeId: number | null
  initialParticipantCount: number | null
  shouldConnect: boolean
  shouldStop: boolean
}

type StreamParticipantCount = {
  challengeId: number
  count: number
}

export function useChallengeParticipantsCountStream({
  challengeId,
  initialParticipantCount,
  shouldConnect,
  shouldStop,
}: UseChallengeParticipantsCountStreamParams): number | null {
  const [streamParticipantCount, setStreamParticipantCount] =
    useState<StreamParticipantCount | null>(null)
  const participantStreamRef = useRef<EventSource | null>(null)
  const hasStoppedParticipantStreamRef = useRef(false)
  const closeParticipantStream = useCallback(() => {
    participantStreamRef.current?.close()
    participantStreamRef.current = null
  }, [])

  useEffect(() => {
    // challengeId가 바뀌면 이전 녹음 중지 상태는 초기화한다.
    hasStoppedParticipantStreamRef.current = false
  }, [challengeId])

  useEffect(() => {
    if (!challengeId) return
    if (!shouldConnect) return
    if (hasStoppedParticipantStreamRef.current) return
    if (participantStreamRef.current) return

    const streamResult = getChallengeParticipantsStream(
      { challengeId },
      {
        onCount: (nextCount) => {
          setStreamParticipantCount({ challengeId, count: nextCount })
        },
        onError: () => {
          closeParticipantStream()
        },
      },
    )

    if (!streamResult.ok) {
      return
    }

    participantStreamRef.current = streamResult.eventSource

    return () => {
      closeParticipantStream()
    }
  }, [challengeId, closeParticipantStream, shouldConnect])

  useEffect(() => {
    if (!shouldStop) return

    hasStoppedParticipantStreamRef.current = true
    closeParticipantStream()
  }, [closeParticipantStream, shouldStop])

  useEffect(() => {
    const handlePageLeave = () => {
      closeParticipantStream()
    }

    window.addEventListener('pagehide', handlePageLeave)
    window.addEventListener('beforeunload', handlePageLeave)

    return () => {
      window.removeEventListener('pagehide', handlePageLeave)
      window.removeEventListener('beforeunload', handlePageLeave)
      closeParticipantStream()
    }
  }, [closeParticipantStream])

  if (streamParticipantCount?.challengeId === challengeId) {
    return streamParticipantCount.count
  }

  return initialParticipantCount
}

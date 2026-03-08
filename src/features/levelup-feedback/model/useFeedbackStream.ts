'use client'

import { useEffect, useState } from 'react'

import { createAttemptStreamToken } from '../api/createAttemptStreamToken'
import { getAttemptDetails } from '../api/getAttemptDetails'
import { getAttemptStream } from '../api/getAttemptStream'

import type { FeedbackItem, FeedbackProcessingStep, FeedbackStatus } from './feedbackTypes'

const FEEDBACK_TIMEOUT_MS = 5 * 60 * 1000
const DEFAULT_FEEDBACK_STATUS: FeedbackStatus = 'PROCESSING'
const TERMINAL_FEEDBACK_STATUSES: FeedbackStatus[] = ['COMPLETED', 'FAILED', 'EXPIRED']

type UseFeedbackStreamOptions = {
  cardId?: number
  attemptId?: number
  onTimeout?: () => void | Promise<void>
  onFailed?: () => void | Promise<void>
}

type UseFeedbackStreamResult = {
  status: FeedbackStatus
  processingStep: FeedbackProcessingStep | null
  feedbackData: FeedbackItem[]
}

const mapFeedbackItem = (
  details: Awaited<ReturnType<typeof getAttemptDetails>>,
): FeedbackItem[] => {
  if (!details?.feedback) {
    return []
  }

  return [
    {
      id: details.attemptId,
      attemptNo: details.attemptNo,
      summary: details.feedback.summary,
      keywords: details.feedback.keywords,
      facts: details.feedback.facts,
      understanding: details.feedback.understanding,
      socraticFeedback: details.feedback.socraticFeedback,
      createdAt: new Date(details.createdAt),
    },
  ]
}

export function useFeedbackStream({
  cardId,
  attemptId,
  onTimeout,
  onFailed,
}: UseFeedbackStreamOptions): UseFeedbackStreamResult {
  // 초기 진입 상태는 기존 폴링 UX와 동일하게 PROCESSING으로 맞춘다.
  const [status, setStatus] = useState<FeedbackStatus>(DEFAULT_FEEDBACK_STATUS)
  const [processingStep, setProcessingStep] = useState<FeedbackProcessingStep | null>(null)
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([])

  const isTerminalStatus = TERMINAL_FEEDBACK_STATUSES.includes(status)

  useEffect(() => {
    // 필수 식별자가 없거나 종료 상태면 같은 토큰으로 재연결하지 않는다.
    if (!cardId || !attemptId || isTerminalStatus) return

    let isCancelled = false
    let isClosedByClient = false
    let timeoutId: number | null = null
    let eventSource: EventSource | null = null

    const closeStream = () => {
      // onerror에서 의도치 않은 실패 처리로 이어지지 않도록 클라이언트 종료 플래그를 먼저 올린다.
      isClosedByClient = true
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
      if (eventSource) {
        eventSource.onmessage = null
        eventSource.onerror = null
        eventSource.close()
        eventSource = null
      }
    }

    const handleCompleted = async () => {
      // COMPLETED 이벤트는 요약 신호이므로, 최종 상세 데이터는 1회 재조회한다.
      const details = await getAttemptDetails(cardId, attemptId)
      if (isCancelled || !details) return

      setStatus('COMPLETED')
      setProcessingStep(null)
      setFeedbackData(mapFeedbackItem(details))
    }

    const startStream = async () => {
      // 1) 스트림 토큰 발급
      const tokenResult = await createAttemptStreamToken(cardId, attemptId)
      if (isCancelled) return
      if (!tokenResult.ok) {
        closeStream()
        void onFailed?.()
        return
      }

      // 2) SSE 연결
      const streamResult = getAttemptStream(
        {
          cardId,
          attemptId,
          token: tokenResult.data.token,
        },
        {
          onMessage: (payload) => {
            if (isCancelled) return

            // 서버 상태를 그대로 UI 상태로 반영한다.
            setStatus(payload.status)
            if (payload.status === 'PROCESSING' && payload.step) {
              setProcessingStep(payload.step)
            } else {
              setProcessingStep(null)
            }

            // 완료/실패/만료는 즉시 스트림을 닫고 후속 처리를 실행한다.
            if (payload.status === 'COMPLETED') {
              closeStream()
              void handleCompleted()
              return
            }

            if (payload.status === 'FAILED') {
              closeStream()
              void onFailed?.()
              return
            }

            if (payload.status === 'EXPIRED') {
              closeStream()
              void onTimeout?.()
              return
            }
          },
          onError: () => {
            if (isCancelled || isClosedByClient) return
            closeStream()
            void onFailed?.()
          },
        },
      )

      if (!streamResult.ok) {
        closeStream()
        void onFailed?.()
        return
      }

      eventSource = streamResult.eventSource
    }

    timeoutId = window.setTimeout(() => {
      // 서버 이벤트가 오지 않아도 무한 대기를 막기 위해 클라이언트 타임아웃을 둔다.
      closeStream()
      void onTimeout?.()
    }, FEEDBACK_TIMEOUT_MS)

    void startStream()

    return () => {
      isCancelled = true
      closeStream()
    }
  }, [attemptId, cardId, isTerminalStatus, onFailed, onTimeout])

  return { status, processingStep, feedbackData }
}

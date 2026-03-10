import { proxyApiClient } from '@/shared/api'

import type { FeedbackProcessingStep, FeedbackStatus } from '../model/feedbackTypes'

export type AttemptStreamPayload = {
  status: FeedbackStatus
  step?: FeedbackProcessingStep
}

type GetAttemptStreamParams = {
  cardId: number
  attemptId: number
  token: string
}

type GetAttemptStreamOptions = {
  onMessage: (payload: AttemptStreamPayload) => void
  onError?: (event: Event) => void
}

export type GetAttemptStreamResult =
  | { ok: true; eventSource: EventSource }
  | { ok: false; reason: string }

const INVALID_PARAMS_REASON = 'invalid_params'
const PARSE_FAILED_REASON = 'parse_failed'
const SSE_STATUS_UPDATE_EVENT_NAME = 'status-update'

const isFeedbackStatus = (value: unknown): value is FeedbackStatus =>
  value === 'PENDING' ||
  value === 'PROCESSING' ||
  value === 'COMPLETED' ||
  value === 'FAILED' ||
  value === 'EXPIRED'

const isFeedbackProcessingStep = (value: unknown): value is FeedbackProcessingStep =>
  value === 'AUDIO_ANALYSIS' || value === 'FEEDBACK_GENERATION'

const parseAttemptStreamPayload = (
  value: unknown,
): { ok: true; data: AttemptStreamPayload } | { ok: false; reason: string } => {
  if (!value || typeof value !== 'object') {
    return { ok: false, reason: PARSE_FAILED_REASON }
  }

  const payload = value as { status?: unknown; step?: unknown }
  if (!isFeedbackStatus(payload.status)) {
    return { ok: false, reason: PARSE_FAILED_REASON }
  }

  if (payload.step !== undefined && !isFeedbackProcessingStep(payload.step)) {
    return { ok: false, reason: PARSE_FAILED_REASON }
  }

  return {
    ok: true,
    data: {
      status: payload.status,
      step: payload.step,
    },
  }
}

const createAttemptStreamUrl = ({ cardId, attemptId, token }: GetAttemptStreamParams) =>
  proxyApiClient.getUri({
    url: `/proxy-api/cards/${cardId}/attempts/${attemptId}/stream`,
    params: { cardId, attemptId, token },
  })

export function getAttemptStream(
  params: GetAttemptStreamParams,
  { onMessage, onError }: GetAttemptStreamOptions,
): GetAttemptStreamResult {
  // SSE URL 생성 전에 필수 파라미터를 검증
  if (!params.cardId || !params.attemptId || !params.token) {
    return { ok: false, reason: INVALID_PARAMS_REASON }
  }

  // EventSource는 브라우저 표준 SSE 클라이언트
  const eventSource = new EventSource(createAttemptStreamUrl(params))

  const handleSseMessage = (event: MessageEvent<string>) => {
    try {
      const parsedPayload = parseAttemptStreamPayload(JSON.parse(event.data))
      if (!parsedPayload.ok) {
        console.error('Failed to parse attempt stream payload', event.data)
        return
      }

      onMessage(parsedPayload.data)
    } catch (error) {
      console.error('Failed to parse attempt stream event', error)
    }
  }

  // 기본 message 이벤트와 커스텀 status-update 이벤트를 모두 수신한다.
  eventSource.onmessage = handleSseMessage
  eventSource.addEventListener(SSE_STATUS_UPDATE_EVENT_NAME, handleSseMessage)

  if (onError) {
    // 연결 끊김/네트워크 오류 처리 전략은 상위 훅(useFeedbackStream)에서 관리
    eventSource.onerror = onError
  }

  return { ok: true, eventSource }
}

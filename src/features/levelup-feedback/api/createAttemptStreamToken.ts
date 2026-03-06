import { proxyApiClient } from '@/shared/api'

export type AttemptStreamTokenData = {
  token: string
  expiresIn?: number
  expiresAt?: string
}

type CreateAttemptStreamTokenResponse = {
  success?: boolean
  data?: AttemptStreamTokenData
  message?: string
  timestamp?: string
}

export type CreateAttemptStreamTokenResult =
  | { ok: true; data: AttemptStreamTokenData }
  | { ok: false; reason: string }

const INVALID_PARAMS_REASON = 'invalid_params'
const EMPTY_DATA_REASON = 'empty_data'
const REQUEST_FAILED_REASON = 'request_failed'

export async function createAttemptStreamToken(
  cardId: number,
  attemptId: number,
): Promise<CreateAttemptStreamTokenResult> {
  if (!cardId || !attemptId) {
    return { ok: false, reason: INVALID_PARAMS_REASON }
  }

  try {
    const response = await proxyApiClient.post<CreateAttemptStreamTokenResponse>(
      `/proxy-api/cards/${cardId}/attempts/${attemptId}/stream-token`,
      {
        cardId,
        attemptId,
      },
    )

    const tokenData = response.data?.data
    if (!tokenData?.token) {
      return { ok: false, reason: EMPTY_DATA_REASON }
    }

    return { ok: true, data: tokenData }
  } catch (error) {
    // 상위 훅에서 실패 사유 분기(onFailed)할 수 있도록 표준 reason을 반환한다.
    console.error('Failed to create attempt stream token', error)
    return { ok: false, reason: REQUEST_FAILED_REASON }
  }
}

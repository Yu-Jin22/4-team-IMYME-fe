import axios from 'axios'

import { httpClient } from '@/shared/api'

type RefreshAccessTokenSuccess = {
  ok: true
  accessToken: string
  nextRefreshToken: string
  expiresIn: number
}

type RefreshAccessTokenFailure = {
  ok: false
  reason: string
  status: number
  detail?: unknown
}

export type RefreshAccessTokenResult = RefreshAccessTokenSuccess | RefreshAccessTokenFailure

const EMPTY_TOKEN = ''
const EMPTY_EXPIRES_AT_MS = 0
const MISSING_REFRESH_TOKEN_STATUS = 401
const MISSING_ACCESS_TOKEN_STATUS = 401
const UNKNOWN_ERROR_STATUS = 500

// 같은 refresh token으로 동시에 들어온 refresh 요청은 하나의 백엔드 호출만 공유
const refreshInFlightMap = new Map<string, Promise<RefreshAccessTokenResult>>()

/* refresh token을 받아서 access token 재발급 결과를 반환하는 함수 */
const requestRefreshAccessToken = async (
  refreshToken: string,
): Promise<RefreshAccessTokenResult> => {
  if (!refreshToken) {
    return {
      ok: false,
      reason: 'missing_refresh_token',
      status: MISSING_REFRESH_TOKEN_STATUS,
    }
  }

  try {
    const response = await httpClient.post(
      '/auth/refresh',
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )

    const accessToken = response.data?.data?.accessToken ?? EMPTY_TOKEN
    const nextRefreshToken = response.data?.data?.refreshToken ?? refreshToken
    const expiresIn = response.data?.data?.expiresIn ?? EMPTY_EXPIRES_AT_MS

    if (!accessToken) {
      return {
        ok: false,
        reason: 'missing_access_token',
        status: MISSING_ACCESS_TOKEN_STATUS,
      }
    }

    return {
      ok: true,
      accessToken,
      nextRefreshToken,
      expiresIn,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        ok: false,
        reason: 'request_failed',
        status: error.response?.status ?? UNKNOWN_ERROR_STATUS,
        detail: error.response?.data,
      }
    }

    return {
      ok: false,
      reason: 'request_failed',
      status: UNKNOWN_ERROR_STATUS,
      detail: error,
    }
  }
}

export const refreshAccessTokenSingleFlight = async (
  refreshToken: string,
): Promise<RefreshAccessTokenResult> => {
  const existingRefreshRequest = refreshInFlightMap.get(refreshToken)
  if (existingRefreshRequest) {
    return existingRefreshRequest
  }

  const refreshRequest = requestRefreshAccessToken(refreshToken).finally(() => {
    refreshInFlightMap.delete(refreshToken)
  })

  refreshInFlightMap.set(refreshToken, refreshRequest)
  return refreshRequest
}

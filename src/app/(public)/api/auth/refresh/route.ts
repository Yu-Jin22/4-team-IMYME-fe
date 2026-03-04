import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXPIRES_AT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  isAccessTokenCookieUsable,
  refreshAccessTokenSingleFlight,
  setAccessTokenCookies,
  setRefreshTokenCookie,
} from '@/features/auth/server'

const E2E_ACCESS_TOKEN_COOKIE = 'e2e_access_token'
const E2E_ACCESS_TOKEN_EXPIRES_AT_COOKIE = 'e2e_access_token_expires_at'

export async function POST() {
  const cookieStore = await cookies()
  const e2eAccessToken = cookieStore.get(E2E_ACCESS_TOKEN_COOKIE)?.value
  const e2eAccessTokenExpiresAt = cookieStore.get(E2E_ACCESS_TOKEN_EXPIRES_AT_COOKIE)?.value
  const accessTokenCookie = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? ''
  const accessTokenExpiresAtValue = cookieStore.get(ACCESS_TOKEN_EXPIRES_AT_COOKIE)?.value ?? ''

  // E2E에서는 refresh token 회전/무효화 정책과 분리해 access token만으로 테스트를 안정화한다.
  if (process.env.ALLOW_E2E_LOGIN === 'true' && e2eAccessToken) {
    return NextResponse.json({
      access_token: e2eAccessToken,
      expiresIn: Number(e2eAccessTokenExpiresAt) || 0,
    })
  }

  // 브라우저 cookie에 아직 유효한 access token이 있으면 backend refresh를 다시 치지 않는다.
  if (isAccessTokenCookieUsable(accessTokenCookie, accessTokenExpiresAtValue)) {
    return NextResponse.json({
      access_token: accessTokenCookie,
      expiresIn: Number(accessTokenExpiresAtValue) || 0,
    })
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  if (!refreshToken) {
    const res = NextResponse.json({ error: 'no_refresh_token' }, { status: 401 })
    clearAuthCookies(res)
    return res
  }

  const refreshResult = await refreshAccessTokenSingleFlight(refreshToken)

  if (!refreshResult.ok) {
    console.error('[token refresh error]', refreshResult.status, refreshResult.detail)
    const res = NextResponse.json({ error: 'refresh_failed' }, { status: 401 })
    clearAuthCookies(res)
    return res
  }

  // 클라이언트가 선제 갱신 스케줄을 잡을 수 있도록 expiresIn도 함께 전달한다.
  const res = NextResponse.json({
    access_token: refreshResult.accessToken,
    expiresIn: refreshResult.expiresIn,
  })

  setAccessTokenCookies(res, refreshResult.accessToken, refreshResult.expiresIn)

  if (refreshResult.nextRefreshToken) {
    setRefreshTokenCookie(res, String(refreshResult.nextRefreshToken))
  }

  return res
}

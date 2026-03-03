import axios from 'axios'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { httpClient } from '@/shared/api'

const REFRESH_TOKEN_COOKIE = 'refresh_token'
const E2E_ACCESS_TOKEN_COOKIE = 'e2e_access_token'
const E2E_ACCESS_TOKEN_EXPIRES_AT_COOKIE = 'e2e_access_token_expires_at'
const COOKIE_PATH = '/'

const clearRefreshTokenCookie = (res: NextResponse) => {
  res.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SECURE === 'true',
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: 0,
  })
}

export async function POST() {
  const cookieStore = await cookies()
  const e2eAccessToken = cookieStore.get(E2E_ACCESS_TOKEN_COOKIE)?.value
  const e2eAccessTokenExpiresAt = cookieStore.get(E2E_ACCESS_TOKEN_EXPIRES_AT_COOKIE)?.value

  // E2E에서는 refresh token 회전/무효화 정책과 분리해 access token만으로 테스트를 안정화한다.
  if (process.env.ALLOW_E2E_LOGIN === 'true' && e2eAccessToken) {
    return NextResponse.json({
      access_token: e2eAccessToken,
      expiresIn: Number(e2eAccessTokenExpiresAt) || 0,
    })
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  if (!refreshToken) {
    const res = NextResponse.json({ error: 'no_refresh_token' }, { status: 401 })
    clearRefreshTokenCookie(res)
    return res
  }

  try {
    const response = await httpClient.post(
      '/auth/refresh',
      { refreshToken }, // 백엔드가 snake_case면 이걸로
      { headers: { 'Content-Type': 'application/json' } },
    )

    const accessToken = response.data?.data?.accessToken
    const nextRefreshToken = response.data?.data?.refreshToken
    const expiresIn = response.data?.data?.expiresIn

    if (!accessToken) {
      const res = NextResponse.json({ error: 'no_access_token' }, { status: 401 })
      clearRefreshTokenCookie(res)
      return res
    }

    // 클라이언트가 선제 갱신 스케줄을 잡을 수 있도록 expiresIn도 함께 전달한다.
    const res = NextResponse.json({ access_token: accessToken, expiresIn })

    if (nextRefreshToken) {
      res.cookies.set('refresh_token', String(nextRefreshToken), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SECURE === 'true',
        sameSite: 'lax',
        path: '/',
      })
    }

    return res
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500
      const data = err.response?.data
      console.error('[token refresh error]', status, data)
    }
    const res = NextResponse.json({ error: 'refresh_failed' }, { status: 401 })
    clearRefreshTokenCookie(res)
    return res
  }
}

import { NextResponse } from 'next/server'

const AUTH_COOKIE_PATH = '/'
const REFRESH_LEEWAY_MS = 60_000
const COOKIE_SECURE =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SECURE === 'true'

export const ACCESS_TOKEN_COOKIE = 'access_token'
export const ACCESS_TOKEN_EXPIRES_AT_COOKIE = 'access_token_expires_at'
export const REFRESH_TOKEN_COOKIE = 'refresh_token'

export const setAccessTokenCookies = (
  response: NextResponse,
  accessToken: string,
  accessTokenExpiresAtMs: number,
) => {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
  })

  response.cookies.set(ACCESS_TOKEN_EXPIRES_AT_COOKIE, String(accessTokenExpiresAtMs), {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
  })
}

export const setRefreshTokenCookie = (response: NextResponse, refreshToken: string) => {
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
  })
}

export const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
    maxAge: 0,
  })

  response.cookies.set(ACCESS_TOKEN_EXPIRES_AT_COOKIE, '', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
    maxAge: 0,
  })

  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
    maxAge: 0,
  })
}

export const isAccessTokenCookieUsable = (
  accessToken: string,
  accessTokenExpiresAtValue: string,
) => {
  if (!accessToken || !accessTokenExpiresAtValue) {
    return false
  }

  const accessTokenExpiresAtMs = Number(accessTokenExpiresAtValue)
  if (!Number.isFinite(accessTokenExpiresAtMs)) {
    return false
  }

  return accessTokenExpiresAtMs - REFRESH_LEEWAY_MS > Date.now()
}

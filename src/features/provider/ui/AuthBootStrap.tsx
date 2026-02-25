'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  useAccessToken,
  useAccessTokenExpiresAtMs,
  useClearAccesstoken,
  useSetAccessToken,
} from '@/features/auth'

const REFRESH_PATH = '/api/auth/refresh'
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
const REFRESH_LEEWAY_SECONDS = 60
const REFRESH_LEEWAY_MS = REFRESH_LEEWAY_SECONDS * 1000

const buildServerUrl = (path: string) => {
  const normalizedBase = SERVER_URL.replace(/\/$/, '')
  return `${normalizedBase}${path}`
}

const getRefreshDelayMs = (accessTokenExpiresAtMs: number) => {
  if (!accessTokenExpiresAtMs) {
    return 0
  }

  // 401 직전이 아니라 만료 60초 전에 미리 갱신해 UX 끊김을 줄인다.
  const refreshAtMs = accessTokenExpiresAtMs - REFRESH_LEEWAY_MS
  return Math.max(0, refreshAtMs - Date.now())
}

export function AuthBootstrap() {
  const accessToken = useAccessToken()
  const accessTokenExpiresAtMs = useAccessTokenExpiresAtMs()
  const setAccessToken = useSetAccessToken()
  const clearAccessToken = useClearAccesstoken()
  const router = useRouter()
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const run = async () => {
      if (isRefreshingRef.current) return
      isRefreshingRef.current = true

      const handleRefreshFailure = (reason: string, details?: Record<string, unknown>) => {
        console.error('[auth-refresh] failed', { reason, ...details })
        clearAccessToken()
        router.replace('/login')
      }

      try {
        const res = await fetch(buildServerUrl(REFRESH_PATH), { method: 'POST' })
        if (!res.ok) {
          handleRefreshFailure('response_not_ok', { status: res.status })
          return
        }

        const data = (await res.json()) as {
          access_token?: string
          expiresIn?: number
        }
        console.log('[auth-refresh] success', {
          hasAccessToken: Boolean(data.access_token),
          expiresIn: data.expiresIn,
        })
        if (!data.access_token) {
          handleRefreshFailure('missing_access_token')
          return
        }
        // refresh 응답의 expiresIn/expires_in을 함께 저장해야 다음 선제 갱신 타이머를 정확히 잡을 수 있다.
        setAccessToken(data.access_token, data.expiresIn)
      } catch {
        handleRefreshFailure('request_failed')
      } finally {
        isRefreshingRef.current = false
      }
    }

    if (!accessToken) {
      void run()
      return () => {
        if (refreshTimer) clearTimeout(refreshTimer)
      }
    }

    // access token이 이미 있으면 만료 시각 기준으로 다음 refresh를 예약한다.
    const refreshDelayMs = getRefreshDelayMs(accessTokenExpiresAtMs)
    console.log('[auth-refresh] schedule', {
      hasAccessToken: Boolean(accessToken),
      accessTokenExpiresAtMs,
      refreshDelayMs,
      now: Date.now(),
    })
    refreshTimer = setTimeout(() => {
      void run()
    }, refreshDelayMs)

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
    }
  }, [accessToken, accessTokenExpiresAtMs, clearAccessToken, router, setAccessToken])

  return null
}

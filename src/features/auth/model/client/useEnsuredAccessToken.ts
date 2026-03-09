'use client'

import { useEffect, useState } from 'react'

import { useAccessToken, useAccessTokenExpiresAtMs, useAuthStore } from './useAuthStore'

const REFRESH_PATH = '/api/auth/refresh'
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
const REFRESH_LEEWAY_MS = 60_000

let ensureAccessTokenPromise: Promise<string | null> | null = null

const buildServerUrl = (path: string) => {
  const normalizedBase = SERVER_URL.replace(/\/$/, '')
  return `${normalizedBase}${path}`
}

const isClientAccessTokenUsable = (accessToken: string, accessTokenExpiresAtMs: number) => {
  if (!accessToken || !accessTokenExpiresAtMs) {
    return false
  }

  return accessTokenExpiresAtMs - REFRESH_LEEWAY_MS > Date.now()
}

export const ensureClientAccessToken = async () => {
  const state = useAuthStore.getState()
  const currentAccessToken = state.accessToken
  const currentAccessTokenExpiresAtMs = state.accessTokenExpiresAtMs

  if (isClientAccessTokenUsable(currentAccessToken, currentAccessTokenExpiresAtMs)) {
    return currentAccessToken
  }

  if (ensureAccessTokenPromise) {
    return ensureAccessTokenPromise
  }

  ensureAccessTokenPromise = (async () => {
    try {
      const response = await fetch(buildServerUrl(REFRESH_PATH), { method: 'POST' })
      if (!response.ok) {
        useAuthStore.getState().actions.clearAccessToken()
        return null
      }

      const data = (await response.json()) as {
        access_token?: string
        expiresIn?: number
      }

      if (!data.access_token) {
        useAuthStore.getState().actions.clearAccessToken()
        return null
      }

      useAuthStore.getState().actions.setAccessToken(data.access_token, data.expiresIn)
      return data.access_token
    } catch {
      return null
    } finally {
      ensureAccessTokenPromise = null
    }
  })()

  return ensureAccessTokenPromise
}

export const useEnsuredAccessToken = (enabled: boolean) => {
  const accessToken = useAccessToken()
  const accessTokenExpiresAtMs = useAccessTokenExpiresAtMs()
  const [ensuredAccessToken, setEnsuredAccessToken] = useState(accessToken)

  useEffect(() => {
    setEnsuredAccessToken(accessToken)
  }, [accessToken])

  useEffect(() => {
    if (!enabled) return

    if (isClientAccessTokenUsable(accessToken, accessTokenExpiresAtMs)) {
      setEnsuredAccessToken(accessToken)
      return
    }

    let isCancelled = false

    const syncAccessToken = async () => {
      const nextAccessToken = await ensureClientAccessToken()
      if (isCancelled) return
      setEnsuredAccessToken(nextAccessToken ?? '')
    }

    void syncAccessToken()

    return () => {
      isCancelled = true
    }
  }, [accessToken, accessTokenExpiresAtMs, enabled])

  return ensuredAccessToken
}

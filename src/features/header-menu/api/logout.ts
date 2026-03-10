import { proxyApiClient } from '@/shared/api'

type LogoutResult = { ok: true } | { ok: false; reason: string }

export async function logout(deviceUuid: string | null): Promise<LogoutResult> {
  try {
    const response = await proxyApiClient.post('/proxy-api/auth/logout', {
      deviceUuid,
    })

    if (response.status !== 204) {
      return { ok: false, reason: 'unexpected_status' }
    }

    try {
      const clearResponse = await fetch('/api/auth/token/refresh/clear', { method: 'POST' })
      if (!clearResponse.ok) {
        return { ok: false, reason: 'refresh_clear_failed' }
      }
    } catch {
      return { ok: false, reason: 'refresh_clear_failed' }
    }

    return { ok: true }
  } catch {
    return { ok: false, reason: 'request_failed' }
  }
}

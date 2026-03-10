import { proxyApiClient } from '@/shared/api'

type DeleteAttemptResult = { ok: true } | { ok: false; reason: string }

export async function deleteAttempt(
  cardId: number,
  attemptId: number,
): Promise<DeleteAttemptResult> {
  try {
    await proxyApiClient.delete(`/proxy-api/cards/${cardId}/attempts/${attemptId}`)

    return { ok: true }
  } catch (error) {
    console.error('Failed to delete attempt', error)
    return { ok: false, reason: 'request_failed' }
  }
}

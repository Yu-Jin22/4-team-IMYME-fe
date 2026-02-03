import { httpClient } from '@/shared'

type DeleteAttemptResult = { ok: true } | { ok: false; reason: string }

export async function deleteAttempt(
  accessToken: string,
  cardId: number,
  attemptId: number,
): Promise<DeleteAttemptResult> {
  try {
    await httpClient.delete(`/cards/${cardId}/attempts/${attemptId}`, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    return { ok: true }
  } catch (error) {
    console.error('Failed to delete attempt', error)
    return { ok: false, reason: 'request_failed' }
  }
}

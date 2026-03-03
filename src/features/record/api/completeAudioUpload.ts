import { proxyApiClient } from '@/shared/api'

type CompleteAudioUploadResponse = {
  data?: {
    attemptId?: number
    status?: string
    message?: string
  }
}

type CompleteAudioUploadResult =
  | { ok: true; data: CompleteAudioUploadResponse['data'] }
  | { ok: false; reason: string }

export async function completeAudioUpload(
  cardId: number,
  attemptId: number,
  objectKey: string,
  durationSeconds: number,
): Promise<CompleteAudioUploadResult> {
  try {
    const response = await proxyApiClient.put<CompleteAudioUploadResponse>(
      `/proxy-api/cards/${cardId}/attempts/${attemptId}/upload-complete`,
      { objectKey, durationSeconds },
    )

    return { ok: true, data: response.data?.data }
  } catch (error) {
    console.error('Failed to complete audio upload', error)
    return { ok: false, reason: 'request_failed' }
  }
}

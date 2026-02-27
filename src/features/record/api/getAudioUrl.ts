import { isSupportedAudioContentType } from '@/shared'
import { httpClient } from '@/shared/api'

type GetAudioUrlResponse = {
  data: {
    attemptId: number
    uploadUrl: string
    objectKey: string
    contentType: string
    expiresAt: string
  }
}

type GetAudioUrlResult =
  | { ok: true; data: GetAudioUrlResponse['data'] }
  | { ok: false; reason: string }

export async function getAudioUrl(
  accessToken: string,
  attemptId: number,
  contentType: string,
): Promise<GetAudioUrlResult> {
  try {
    if (!isSupportedAudioContentType(contentType)) {
      console.error('Unsupported audio content type', contentType)
      return { ok: false, reason: 'unsupported_content_type' }
    }

    const response = await httpClient.post<GetAudioUrlResponse>(
      '/learning/presigned-url',
      { attemptId, contentType },
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      },
    )

    return { ok: true, data: response.data?.data }
  } catch (error) {
    console.error('Failed to get audio URL', error)
    return { ok: false, reason: 'request_failed' }
  }
}

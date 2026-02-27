import { isSupportedAudioContentType } from '@/shared'

type UploadPvPSubmissionAudioResult = { ok: true } | { ok: false; reason: string }

export async function uploadPvPSubmissionAudio(
  uploadUrl: string,
  file: Blob,
  contentType: string | null,
): Promise<UploadPvPSubmissionAudioResult> {
  try {
    if (!isSupportedAudioContentType(contentType)) {
      console.error('Unsupported audio content type', contentType)
      return { ok: false, reason: 'unsupported_content_type' }
    }

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    })

    if (!response.ok) {
      return { ok: false, reason: 'upload_failed' }
    }

    return { ok: true }
  } catch (error) {
    console.error('Failed to upload pvp submission audio', error)
    return { ok: false, reason: 'request_failed' }
  }
}

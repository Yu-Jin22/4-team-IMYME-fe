import { httpClient } from '@/shared/api'

export type CreatePvPSubmissionPayload = {
  fileName: string
  contentType: string
  fileSize: number
}

export type PvPSubmissionStatus = 'PENDING' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type PvPSubmission = {
  submissionId: number
  roomId: number
  uploadUrl: string
  audioUrl: string
  expiresIn: number
  status: PvPSubmissionStatus
  submittedAt: string
  message: string | null
}

type CreatePvPSubmissionResponse = {
  success?: boolean
  data?: PvPSubmission
  message?: string
  timestamp?: string
}

export type CreatePvPSubmissionResult =
  | { ok: true; data: PvPSubmission }
  | { ok: false; reason: string }

export async function createPvPSubmission(
  accessToken: string,
  roomId: number,
  payload: CreatePvPSubmissionPayload,
): Promise<CreatePvPSubmissionResult> {
  try {
    const response = await httpClient.post<CreatePvPSubmissionResponse>(
      `/pvp/rooms/${roomId}/submissions`,
      payload,
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      },
    )

    const submission = response.data?.data
    if (!submission) {
      return { ok: false, reason: 'empty_submission' }
    }

    return { ok: true, data: submission }
  } catch (error) {
    console.error('Failed to create pvp submission', error)
    return { ok: false, reason: 'request_failed' }
  }
}

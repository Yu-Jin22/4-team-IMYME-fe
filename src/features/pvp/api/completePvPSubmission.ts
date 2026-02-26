import { httpClient } from '@/shared/api'

import type { PvPSubmission } from './createPvPSubmission'

export type CompletePvPSubmissionPayload = {
  durationSeconds: number
}

type CompletePvPSubmissionResponse = {
  success?: boolean
  data?: PvPSubmission
  message?: string
  timestamp?: string
}

export type CompletePvPSubmissionResult =
  | { ok: true; data: PvPSubmission }
  | { ok: false; reason: string }

export async function completePvPSubmission(
  accessToken: string,
  submissionId: number,
  payload: CompletePvPSubmissionPayload,
): Promise<CompletePvPSubmissionResult> {
  try {
    const response = await httpClient.post<CompletePvPSubmissionResponse>(
      `/pvp/rooms/submissions/${submissionId}/complete`,
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
    console.error('Failed to complete pvp submission', error)
    return { ok: false, reason: 'request_failed' }
  }
}

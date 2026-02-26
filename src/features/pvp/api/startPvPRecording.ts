import { httpClient } from '@/shared/api'

import type { PvPRoomDetails } from '@/entities/room'

type StartPvPRecordingResponse = {
  success?: boolean
  data?: PvPRoomDetails
  message?: string
  timestamp?: string
}

export type StartPvPRecordingResult =
  | { ok: true; data: PvPRoomDetails }
  | { ok: false; reason: string }

export async function startPvPRecording(
  accessToken: string,
  roomId: number,
): Promise<StartPvPRecordingResult> {
  try {
    const response = await httpClient.post<StartPvPRecordingResponse>(
      `/pvp/rooms/${roomId}/start-recording`,
      null,
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      },
    )

    const roomDetails = response.data?.data
    if (!roomDetails) {
      return { ok: false, reason: 'empty_room' }
    }

    return { ok: true, data: roomDetails }
  } catch (error) {
    console.error('Failed to start pvp recording', error)
    return { ok: false, reason: 'request_failed' }
  }
}

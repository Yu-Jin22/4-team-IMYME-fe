import { httpClient } from '@/shared/api'

import type { PvPRoomDetails } from '@/entities/room'

type JoinPvPRoomResponse = {
  success?: boolean
  data?: PvPRoomDetails
  message?: string
  timestamp?: string
}

export type JoinPvPRoomResult = { ok: true; data: PvPRoomDetails } | { ok: false; reason: string }

export async function joinPvPRoom(accessToken: string, roomId: number): Promise<JoinPvPRoomResult> {
  try {
    const response = await httpClient.post<JoinPvPRoomResponse>(`/pvp/rooms/${roomId}/join`, null, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    const roomDetails = response.data?.data
    if (!roomDetails) {
      return { ok: false, reason: 'empty_room' }
    }

    return { ok: true, data: roomDetails }
  } catch (error) {
    console.error('Failed to join pvp room', error)
    return { ok: false, reason: 'request_failed' }
  }
}

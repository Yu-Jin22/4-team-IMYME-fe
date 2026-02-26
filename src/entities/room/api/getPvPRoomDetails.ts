import { httpClient } from '@/shared/api'

import type { PvPRoomDetails } from './createPvPRoom'

type GetPvPRoomDetailsResponse = {
  success?: boolean
  data?: PvPRoomDetails
  message?: string
  timestamp?: string
}

export async function getPvPRoomDetails(
  accessToken: string,
  roomId: number,
): Promise<PvPRoomDetails | null> {
  try {
    const response = await httpClient.get<GetPvPRoomDetailsResponse>(`/pvp/rooms/${roomId}`, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to fetch pvp room details', error)
    return null
  }
}

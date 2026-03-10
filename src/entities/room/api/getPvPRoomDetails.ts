import { proxyApiClient } from '@/shared/api'

import type { PvPRoomDetails } from './createPvPRoom'

type GetPvPRoomDetailsResponse = {
  success?: boolean
  data?: PvPRoomDetails
  message?: string
  timestamp?: string
}

export async function getPvPRoomDetails(roomId: number): Promise<PvPRoomDetails | null> {
  try {
    const response = await proxyApiClient.get<GetPvPRoomDetailsResponse>(
      `/proxy-api/pvp/rooms/${roomId}`,
    )

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to fetch pvp room details', error)
    return null
  }
}

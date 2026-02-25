import { httpClient } from '@/shared/api'

type PvPRoomStatus =
  | 'OPEN'
  | 'MATCHED'
  | 'THINKING'
  | 'RECORDING'
  | 'PROCESSING'
  | 'FINISHED'
  | 'CANCELED'
  | 'EXPIRED'

export type CreatePvPRoomPayload = {
  categoryId: number
  roomName: string
}

export type PvPRoomKeyword = {
  id: number
  name: string
}

export type PvPRoomUserSummary = {
  id: number
  nickname: string
  profileImageUrl: string
  level: number
}

export type PvPRoomCategorySummary = {
  id: number
  name: string
}

export type PvPRoomInfoSummary = {
  id: number
  name: string
}

export type PvPRoomDetails = {
  room: PvPRoomInfoSummary
  category: PvPRoomCategorySummary
  status: PvPRoomStatus
  host: PvPRoomUserSummary
  guest: PvPRoomUserSummary
  keyword: PvPRoomKeyword
  createdAt: string
  matchedAt: string
  startedAt: string
  thinkingEndsAt: string
  message: string
}

type CreatePvPRoomResponse = {
  success?: boolean
  data?: PvPRoomDetails
  message?: string
  timestamp?: string
}

export async function createPvPRoom(
  accessToken: string,
  payload: CreatePvPRoomPayload,
): Promise<PvPRoomDetails | null> {
  try {
    const response = await httpClient.post<CreatePvPRoomResponse>('/pvp/rooms', payload, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to create pvp room', error)
    return null
  }
}

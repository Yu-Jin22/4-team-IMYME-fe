import { httpClient } from '@/shared'

export type PvPRoomStatus =
  | 'OPEN'
  | 'MATCHED'
  | 'THINKING'
  | 'RECORDING'
  | 'PROCESSING'
  | 'FINISHED'
  | 'CANCELED'
  | 'EXPIRED'

export type GetPvPRoomsParams = {
  categoryId?: number
  status?: PvPRoomStatus
  cursor?: number | string
  size?: number
}

export type PvPRoomListItem = {
  id: number
  categoryId: number
  categoryName: string
  roomName: string
  status: PvPRoomStatus
  hostUserId: number
  hostNickname: string
  createdAt: string
}

export type PvPRoomListMeta = {
  size: number
  hasNext: boolean
  nextCursor: string | null
}

export type GetPvPRoomsData = {
  rooms: PvPRoomListItem[]
  meta: PvPRoomListMeta
}

type GetPvPRoomsResponse = {
  success?: boolean
  data?: GetPvPRoomsData
  message?: string
  timestamp?: string
}

export type GetPvPRoomsResult = { ok: true; data: GetPvPRoomsData } | { ok: false; reason: string }

export async function getPvPRooms(
  accessToken: string,
  params: GetPvPRoomsParams = {},
): Promise<GetPvPRoomsResult> {
  const roomStatus = params.status ?? 'OPEN'

  try {
    const response = await httpClient.get<GetPvPRoomsResponse>('/pvp/rooms', {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
      params: {
        ...(params.categoryId !== undefined ? { categoryId: params.categoryId } : {}),
        status: roomStatus,
        ...(params.cursor !== undefined ? { cursor: params.cursor } : {}),
        ...(params.size !== undefined ? { size: params.size } : {}),
      },
    })

    const roomListData = response.data?.data
    if (!roomListData) {
      return { ok: false, reason: 'empty_rooms' }
    }

    return { ok: true, data: roomListData }
  } catch (error) {
    console.error('Failed to fetch PvP rooms', error)
    return { ok: false, reason: 'request_failed' }
  }
}

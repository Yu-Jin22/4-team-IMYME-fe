import { useQuery } from '@tanstack/react-query'

import { getPvPRooms } from '../api/getPvPRooms'

import type { GetPvPRoomsParams } from '../api/getPvPRooms'

export function useRoomList(accessToken: string, params: GetPvPRoomsParams = {}) {
  return useQuery({
    queryKey: ['pvpRooms', params.categoryId, params.status ?? 'OPEN', params.cursor, params.size],
    queryFn: () => getPvPRooms(accessToken, params),
    enabled: Boolean(accessToken),
  })
}

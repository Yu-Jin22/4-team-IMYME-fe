import { useQuery } from '@tanstack/react-query'

import { joinPvPRoom } from '../api/joinPvPRoom'

export const PVP_ROOM_JOIN_QUERY_KEY = 'pvpRoomJoin'

export const getPvPRoomJoinQueryKey = (roomId: number) => [PVP_ROOM_JOIN_QUERY_KEY, roomId] as const

type UsePvPRoomJoinQueryOptions = {
  enabled?: boolean
}

export function usePvPRoomJoinQuery(roomId: number, options: UsePvPRoomJoinQueryOptions = {}) {
  const isInvalidRoomId = Number.isNaN(roomId)
  const enabled = options.enabled ?? true

  return useQuery({
    queryKey: getPvPRoomJoinQueryKey(roomId),
    enabled: enabled && !isInvalidRoomId,
    refetchOnMount: false,
    queryFn: async () => {
      if (isInvalidRoomId) {
        return { ok: false as const, reason: 'invalid_request' as const }
      }

      return joinPvPRoom(roomId)
    },
  })
}

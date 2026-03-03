'use client'

import { useQuery } from '@tanstack/react-query'

import { getPvPRoomDetails } from '../api/getPvPRoomDetails'

type UsePvPRoomDetailsOptions = {
  enabled?: boolean
}

export function usePvPRoomDetails(
  accessToken: string | null,
  roomId: number | undefined,
  options?: UsePvPRoomDetailsOptions,
) {
  const enabled = options?.enabled ?? true

  return useQuery({
    queryKey: ['pvpRoomDetails', roomId],
    enabled: Boolean(accessToken) && Boolean(roomId) && enabled,
    queryFn: async () => {
      if (!accessToken || !roomId) {
        return null
      }

      return getPvPRoomDetails(accessToken, roomId)
    },
  })
}

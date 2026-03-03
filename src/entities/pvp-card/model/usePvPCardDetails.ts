'use client'

import { useQuery } from '@tanstack/react-query'

import { getPvPCardDetails } from '../api/getPvPCardDetails'

type UsePvPCardDetailsOptions = {
  enabled?: boolean
}

export function usePvPCardDetails(roomId: number | undefined, options?: UsePvPCardDetailsOptions) {
  const enabled = options?.enabled ?? true

  return useQuery({
    queryKey: ['pvpCardDetails', roomId],
    enabled: Boolean(roomId) && enabled,
    queryFn: async () => {
      if (!roomId) {
        return null
      }

      return getPvPCardDetails(roomId)
    },
  })
}

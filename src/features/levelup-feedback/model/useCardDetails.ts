import { useQuery } from '@tanstack/react-query'

import { getCardDetails } from '../api/getCardDetails'

export function useCardDetails(accessToken: string, cardId: number | undefined) {
  return useQuery({
    queryKey: ['cardDetails', cardId],
    queryFn: () => getCardDetails(accessToken, cardId),
    enabled: Boolean(accessToken) && Boolean(cardId),
  })
}

import { useQuery } from '@tanstack/react-query'

import { getCardDetails } from '../api/getCardDetails'

export function useCardDetails(cardId: number | undefined) {
  return useQuery({
    queryKey: ['cardDetails', cardId],
    queryFn: () => getCardDetails(cardId),
    enabled: Boolean(cardId),
  })
}

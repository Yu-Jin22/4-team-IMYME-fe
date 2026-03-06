import { useQuery } from '@tanstack/react-query'

import { getCardDetails } from '../api/getCardDetails'

import type { CardDetails } from '../api/getCardDetails'

type UseCardDetailsOptions = {
  initialData?: CardDetails | null
}

export function useCardDetails(
  cardId: number | undefined,
  { initialData }: UseCardDetailsOptions = {},
) {
  return useQuery<CardDetails | null>({
    queryKey: ['cardDetails', cardId],
    queryFn: () => getCardDetails(cardId),
    enabled: Boolean(cardId),
    initialData,
  })
}

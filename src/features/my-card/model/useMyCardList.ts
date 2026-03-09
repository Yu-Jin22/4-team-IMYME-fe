import { useQuery } from '@tanstack/react-query'

import { getMyCards } from '../api/getMyCards'

import type { MyCardItem } from '../api/getMyCards'

export function useMyCardList(userId: number, limit?: number) {
  return useQuery<MyCardItem[]>({
    queryKey: ['myCards', userId, limit],
    queryFn: () => getMyCards(limit),
  })
}

import { useQuery } from '@tanstack/react-query'

import { getMyPvPCardList } from '../api/getMyPvPCardList'

import type { GetMyPvPCardListParams } from '../api/getMyPvPCardList'

export function useMyPvPCardList(accessToken: string, params: GetMyPvPCardListParams = {}) {
  return useQuery({
    queryKey: ['myPvPCardList', params.categoryId, params.keywordId],
    queryFn: () => getMyPvPCardList(accessToken, params),
    enabled: Boolean(accessToken),
  })
}

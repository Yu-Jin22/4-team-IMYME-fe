import { useQueries, useQuery } from '@tanstack/react-query'

import { getAttemptDetails } from '../api/getAttemptDetails'

export function useAttemptDetails(
  accessToken: string,
  cardId: number | undefined,
  attemptId: number | undefined,
) {
  return useQuery({
    queryKey: ['attemptDetails', cardId, attemptId, accessToken],
    queryFn: () => getAttemptDetails(accessToken, cardId, attemptId),
    enabled: Boolean(accessToken) && Boolean(cardId) && Boolean(attemptId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })
}

type AttemptParams = {
  cardId: number
  attemptId: number
}

export function useAttemptDetailsList(accessToken: string, attempts: AttemptParams[]) {
  return useQueries({
    queries: attempts.map((attempt) => ({
      queryKey: ['attemptDetails', attempt.cardId, attempt.attemptId, accessToken],
      queryFn: () => getAttemptDetails(accessToken, attempt.cardId, attempt.attemptId),
      enabled: Boolean(accessToken) && Boolean(attempt.cardId) && Boolean(attempt.attemptId),
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always' as const,
    })),
  })
}

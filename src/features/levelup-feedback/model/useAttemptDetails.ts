import { useQueries, useQuery } from '@tanstack/react-query'

import { getAttemptDetails } from '../api/getAttemptDetails'

export function useAttemptDetails(cardId: number | undefined, attemptId: number | undefined) {
  return useQuery({
    queryKey: ['attemptDetails', cardId, attemptId],
    queryFn: () => getAttemptDetails(cardId, attemptId),
    enabled: Boolean(cardId) && Boolean(attemptId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })
}

type AttemptParams = {
  cardId: number
  attemptId: number
}

export function useAttemptDetailsList(attempts: AttemptParams[]) {
  return useQueries({
    queries: attempts.map((attempt) => ({
      queryKey: ['attemptDetails', attempt.cardId, attempt.attemptId],
      queryFn: () => getAttemptDetails(attempt.cardId, attempt.attemptId),
      enabled: Boolean(attempt.cardId) && Boolean(attempt.attemptId),
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always' as const,
    })),
  })
}

import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { getTodayChallenge } from '../api/getTodayChallenge'

import type { TodayChallengeData } from '../api/getTodayChallenge'

const OPEN_CHALLENGE_STATUS = 'OPEN'
const CHALLENGE_TODAY_QUERY_KEY = ['challenge', 'today'] as const
const CHALLENGE_TODAY_STALE_TIME_MS = 30_000
const CHALLENGE_TODAY_GC_TIME_MS = 5 * 60_000
const CLOSED_CHALLENGE_ERROR_PREFIX = 'challenge_not_open'

const getTodayChallengeOrThrow = async (): Promise<TodayChallengeData> => {
  const result = await getTodayChallenge()

  if (!result.ok) {
    throw new Error(result.reason)
  }

  if (result.data.status !== OPEN_CHALLENGE_STATUS) {
    throw new Error(`${CLOSED_CHALLENGE_ERROR_PREFIX}:${result.data.status}`)
  }

  return result.data
}

export function useTodayChallenge(): UseQueryResult<TodayChallengeData, Error> {
  return useQuery<TodayChallengeData, Error>({
    queryKey: CHALLENGE_TODAY_QUERY_KEY,
    queryFn: getTodayChallengeOrThrow,
    retry: false,
    staleTime: CHALLENGE_TODAY_STALE_TIME_MS,
    gcTime: CHALLENGE_TODAY_GC_TIME_MS,
  })
}

'use client'

import { useQuery } from '@tanstack/react-query'

import { getMyProfile } from '@/entities/user'

import type { UserProfile } from './userProfile'

type UseMyProfileQueryOptions = {
  enabled?: boolean
}

type UseMyProfileQueryResult = {
  data?: UserProfile
  isLoading: boolean
  isError: boolean
}

const PROFILE_QUERY_STALE_TIME_MINUTES = 10
const ONE_MINUTE_IN_MILLISECONDS = 60_000
const PROFILE_QUERY_STALE_TIME_MS = PROFILE_QUERY_STALE_TIME_MINUTES * ONE_MINUTE_IN_MILLISECONDS

export function useMyProfileQuery(options?: UseMyProfileQueryOptions): UseMyProfileQueryResult {
  // 외부에서 쿼리 활성/비활성 제어
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: ['myProfile'],
    enabled,
    queryFn: async () => {
      const result = await getMyProfile()
      if (!result.ok) {
        throw new Error(result.reason)
      }
      return result.data
    },
    // 10분 동안은 fresh로 간주해 불필요한 재요청 방지
    staleTime: PROFILE_QUERY_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  // 컴포넌트에 필요한 최소 상태만 반환
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

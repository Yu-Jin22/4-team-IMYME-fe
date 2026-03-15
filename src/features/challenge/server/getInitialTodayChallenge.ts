import { httpClient } from '@/shared/api'

import type { TodayChallengeData } from '../api/getTodayChallenge'

type GetTodayChallengeResponse = {
  data?: TodayChallengeData
}

export async function getInitialTodayChallenge(
  accessToken: string,
): Promise<TodayChallengeData | null> {
  if (!accessToken) {
    return null
  }

  try {
    const response = await httpClient.get<GetTodayChallengeResponse>('/challenge/today', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data?.data ?? null
  } catch {
    return null
  }
}

import { proxyApiClient } from '@/shared/api'

type StartWarmupPayload = {
  cardId: number
}

type StartWarmupResponse = {
  data?: {
    attemptId: number
  }
}

export async function startWarmup(payload: StartWarmupPayload) {
  try {
    const response = await proxyApiClient.post<StartWarmupResponse>(
      '/proxy-api/learning/warmup',
      payload,
    )

    return response.data
  } catch (error) {
    console.error('Failed to start warmup', error)
    return null
  }
}

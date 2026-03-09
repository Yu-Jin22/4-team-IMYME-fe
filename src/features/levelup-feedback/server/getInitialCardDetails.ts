import { httpClient } from '@/shared/api'

import type { CardDetails } from '../api/getCardDetails'

type CardDetailsResponse = {
  data?: CardDetails
}

export async function getInitialCardDetails(
  accessToken: string,
  cardId: number | undefined,
): Promise<CardDetails | null> {
  if (!accessToken || !cardId) {
    return null
  }

  try {
    const response = await httpClient.get<CardDetailsResponse>(`/cards/${cardId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data?.data ?? null
  } catch {
    return null
  }
}

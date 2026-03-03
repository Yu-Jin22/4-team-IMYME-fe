import { httpClient } from '@/shared/api'

const HIDE_PVP_CARD_PAYLOAD = {
  isHidden: true,
} as const

export type HidePvPCardResult = {
  historyId: number
  isHidden: boolean
  updatedAt: string
}

type HidePvPCardResponse = {
  success?: boolean
  data?: HidePvPCardResult
  message?: string
  timestamp?: string
}

export async function hidePvPCard(
  accessToken: string,
  historyId: number,
): Promise<HidePvPCardResult | null> {
  try {
    const response = await httpClient.patch<HidePvPCardResponse>(
      `/pvp/histories/my-rooms/${historyId}`,
      HIDE_PVP_CARD_PAYLOAD,
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      },
    )

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to hide pvp card', error)
    return null
  }
}

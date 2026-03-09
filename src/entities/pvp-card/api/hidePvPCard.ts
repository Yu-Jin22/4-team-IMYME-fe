import { proxyApiClient } from '@/shared/api'

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

export async function hidePvPCard(historyId: number): Promise<HidePvPCardResult | null> {
  try {
    const response = await proxyApiClient.patch<HidePvPCardResponse>(
      `/proxy-api/pvp/histories/my-rooms/${historyId}`,
      HIDE_PVP_CARD_PAYLOAD,
    )

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to hide pvp card', error)
    return null
  }
}

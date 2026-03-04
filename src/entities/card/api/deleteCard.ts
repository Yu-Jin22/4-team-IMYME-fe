import { proxyApiClient } from '@/shared/api'

export async function deleteCard(cardId: number) {
  try {
    const response = await proxyApiClient.delete(`/proxy-api/cards/${cardId}`)

    return response.status === 204
  } catch (error) {
    console.error('Failed to delete card', error)
    return false
  }
}

import { proxyApiClient } from '@/shared/api'

const DELETE_SUCCESS_STATUS = 204

export async function exitPvPRoom(roomId: number) {
  try {
    const response = await proxyApiClient.delete(`/proxy-api/pvp/rooms/${roomId}`)

    return response.status === DELETE_SUCCESS_STATUS
  } catch (error) {
    console.error('Failed to exit pvp room', error)
    return false
  }
}

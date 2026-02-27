import { httpClient } from '@/shared/api'

const DELETE_SUCCESS_STATUS = 204

export async function exitPvPRoom(accessToken: string, roomId: number) {
  try {
    const response = await httpClient.delete(`/pvp/rooms/${roomId}`, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    return response.status === DELETE_SUCCESS_STATUS
  } catch (error) {
    console.error('Failed to exit pvp room', error)
    return false
  }
}

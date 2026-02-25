import { httpClient } from '@/shared/api'

const SUCCESS_STATUS_MIN = 200
const SUCCESS_STATUS_MAX_EXCLUSIVE = 300

export async function deletePvPRoom(accessToken: string, roomId: number) {
  try {
    const response = await httpClient.delete(`/pvp/rooms/${roomId}`, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    return response.status >= SUCCESS_STATUS_MIN && response.status < SUCCESS_STATUS_MAX_EXCLUSIVE
  } catch (error) {
    console.error('Failed to delete pvp room', error)
    return false
  }
}

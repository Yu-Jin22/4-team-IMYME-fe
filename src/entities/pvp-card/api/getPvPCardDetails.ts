import { httpClient } from '@/shared/api'

type PvPCardResultStatus =
  | 'OPEN'
  | 'MATCHED'
  | 'THINKING'
  | 'RECORDING'
  | 'PROCESSING'
  | 'FINISHED'
  | 'CANCELED'
  | 'EXPIRED'

export type PvPCardRoomResult = {
  id: number
  name: string
}

export type PvPCardResultSubject = {
  id: number
  name: string
}

export type PvPCardResultFeedback = {
  summary: string
  keywords: string
  facts: string
  understanding: string
  socraticFeedback: string
}

export type PvPUser = {
  userId: number
  nickname: string
  profileImageUrl: string
}

export type PvPCardPlayerResult = {
  historyId: number
  isHidden: boolean
  user: PvPUser
  score: number
  audioUrl: string
  durationSeconds: number
  sttText: string
  feedback: PvPCardResultFeedback
}

export type PvPCardOpponentInfo = {
  userId: number
  nickname: string
  profileImageUrl: string
}

export type PvPCardWinner = {
  userId: number
  nickname: string
  profileImageUrl: string
}

export type PvPCardDetails = {
  room: PvPCardRoomResult
  status: PvPCardResultStatus
  category: PvPCardResultSubject
  keyword: PvPCardResultSubject
  myResult: PvPCardPlayerResult
  opponentResult: PvPCardPlayerResult
  winner: PvPCardWinner
  finishedAt: string
  message: string
}

type GetPvPCardDetailsResponse = {
  success?: boolean
  data?: PvPCardDetails
  message?: string
  timestamp?: string
}

export async function getPvPCardDetails(
  accessToken: string,
  roomId: number,
): Promise<PvPCardDetails | null> {
  try {
    const response = await httpClient.get<GetPvPCardDetailsResponse>(
      `/pvp/rooms/${roomId}/result`,
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      },
    )

    return response.data?.data ?? null
  } catch (error) {
    console.error('Failed to fetch pvp card details', error)
    return null
  }
}

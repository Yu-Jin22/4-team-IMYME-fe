import axios from 'axios'

import { httpClient } from '@/shared/api'

type PvPRoomStatus =
  | 'OPEN'
  | 'MATCHED'
  | 'THINKING'
  | 'RECORDING'
  | 'PROCESSING'
  | 'FINISHED'
  | 'CANCELED'
  | 'EXPIRED'

export type CreatePvPRoomPayload = {
  categoryId: number
  roomName: string
}

export type PvPRoomKeyword = {
  id: number
  name: string
}

export type PvPRoomUserSummary = {
  id: number
  nickname: string
  profileImageUrl: string
  level: number
}

export type PvPRoomCategorySummary = {
  id: number
  name: string
}

export type PvPRoomInfoSummary = {
  id: number
  name: string
}

export type PvPRoomDetails = {
  room: PvPRoomInfoSummary
  category: PvPRoomCategorySummary
  status: PvPRoomStatus
  host: PvPRoomUserSummary
  guest: PvPRoomUserSummary | null
  keyword: PvPRoomKeyword | null
  createdAt: string
  matchedAt: string | null
  startedAt: string | null
  thinkingEndsAt: string | null
  message: string | null
}

type CreatePvPRoomResponse = {
  success?: boolean
  data?: PvPRoomDetails
  message?: string
  timestamp?: string
}

type CreatePvPRoomErrorResponse = {
  error?: string
  message?: string
  details?: {
    reason?: string
    field?: string
    rejectedValue?: string
  }
  timestamp?: string
  path?: string
}

export type CreatePvPRoomResult =
  | { ok: true; data: PvPRoomDetails }
  | {
      ok: false
      error: 'VALIDATION_FAILED'
      message: string
      details?: CreatePvPRoomErrorResponse['details']
    }
  | { ok: false; error: 'FORBIDDEN_WORD'; message: string }
  | { ok: false; error: 'UNKNOWN'; message: string }

export async function createPvPRoom(
  accessToken: string,
  payload: CreatePvPRoomPayload,
): Promise<CreatePvPRoomResult> {
  try {
    const response = await httpClient.post<CreatePvPRoomResponse>('/pvp/rooms', payload, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    })

    const roomDetails = response.data?.data
    if (!roomDetails) {
      return { ok: false, error: 'UNKNOWN', message: 'empty_response' }
    }

    return { ok: true, data: roomDetails }
  } catch (error) {
    if (axios.isAxiosError<CreatePvPRoomErrorResponse>(error)) {
      const responseError = error.response?.data
      const errorCode = responseError?.error
      const errorMessage = responseError?.message ?? 'request_failed'

      if (errorCode === 'VALIDATION_FAILED') {
        return {
          ok: false,
          error: 'VALIDATION_FAILED',
          message: errorMessage,
          details: responseError?.details,
        }
      }

      if (errorCode === 'FORBIDDEN_WORD') {
        return {
          ok: false,
          error: 'FORBIDDEN_WORD',
          message: errorMessage,
        }
      }
    }

    console.error('Failed to create pvp room', error)
    return { ok: false, error: 'UNKNOWN', message: 'request_failed' }
  }
}

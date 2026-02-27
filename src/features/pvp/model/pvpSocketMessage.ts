// 브로드캐스트 type 상수 union
export type PvpSocketMessageType =
  | 'ROOM_JOINED'
  | 'ROOM_LEFT'
  | 'STATUS_CHANGE'
  | 'PLAYER_READY'
  | 'ANSWER_SUBMITTED'

// 서버 room status union
export type PvpRoomStatus =
  | 'OPEN'
  | 'MATCHED'
  | 'THINKING'
  | 'RECORDING'
  | 'PROCESSING'
  | 'FINISHED'
  | 'CANCELED'
  | 'EXPIRED'

// 참여자 role union
export type PvpParticipantRole = 'HOST' | 'GUEST'

// 키워드 payload shape
export type PvpKeywordPayload = {
  id: number
  name: string
}

// ROOM_JOINED / ROOM_LEFT / PLAYER_READY 공통 payload shape
export type PvpParticipantEventData = Record<string, unknown> & {
  userId: number
  nickname: string
  role: PvpParticipantRole
  message: string | null
}

// STATUS_CHANGE payload shape
export type PvpStatusChangeData = Record<string, unknown> & {
  status: PvpRoomStatus
  keyword: PvpKeywordPayload | null
  startedAt: string | null
  thinkingEndsAt: string | null
  message: string | null
}

// 공통 브로드캐스트 베이스 필드
type PvpSocketMessageBase = {
  roomId: number
  message: string | null
  timestamp: number | null
}

// type별 메시지 union
export type PvpSocketMessage =
  | (PvpSocketMessageBase & {
      type: 'ROOM_JOINED'
      data: PvpParticipantEventData
    })
  | (PvpSocketMessageBase & {
      type: 'ROOM_LEFT'
      data: PvpParticipantEventData
    })
  | (PvpSocketMessageBase & {
      type: 'PLAYER_READY'
      data: PvpParticipantEventData
    })
  | (PvpSocketMessageBase & {
      type: 'STATUS_CHANGE'
      data: PvpStatusChangeData
    })
  | (PvpSocketMessageBase & {
      type: 'ANSWER_SUBMITTED'
      data: PvpParticipantEventData
    })

// unknown을 레코드로 확인하는 공통 가드
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

// string | null | undefined만 허용
const isNullableStringOrUndefined = (value: unknown) =>
  value === undefined || value === null || typeof value === 'string'

// number | null | undefined만 허용
const isNullableNumberOrUndefined = (value: unknown) =>
  value === undefined || value === null || typeof value === 'number'

// keyword payload를 안전하게 파싱한다.
const parseKeyword = (value: unknown): PvpKeywordPayload | null => {
  if (value === null) return null
  if (!isRecord(value)) return null

  const id = value.id
  const name = value.name

  if (typeof id !== 'number') return null
  if (typeof name !== 'string') return null

  return { id, name }
}

// ROOM_JOINED / ROOM_LEFT / PLAYER_READY payload 파서
const parseParticipantEventData = (value: unknown): PvpParticipantEventData | null => {
  if (!isRecord(value)) return null

  const userId = value.userId
  const nickname = value.nickname
  const role = value.role
  const message = value.message

  if (typeof userId !== 'number') return null
  if (typeof nickname !== 'string') return null
  if (role !== 'HOST' && role !== 'GUEST') return null
  if (message !== null && typeof message !== 'string') return null

  return {
    ...value,
    userId,
    nickname,
    role,
    message,
  }
}

// STATUS_CHANGE payload 파서
const parseStatusChangeData = (value: unknown): PvpStatusChangeData | null => {
  if (!isRecord(value)) return null

  const status = value.status
  const keyword = parseKeyword(value.keyword)
  const startedAt = value.startedAt
  const thinkingEndsAt = value.thinkingEndsAt
  const message = value.message

  const isValidStatus =
    status === 'OPEN' ||
    status === 'MATCHED' ||
    status === 'THINKING' ||
    status === 'RECORDING' ||
    status === 'PROCESSING' ||
    status === 'FINISHED' ||
    status === 'CANCELED' ||
    status === 'EXPIRED'

  if (!isValidStatus) return null
  if (keyword === null && value.keyword !== null) return null
  if (!isNullableStringOrUndefined(startedAt)) return null
  if (!isNullableStringOrUndefined(thinkingEndsAt)) return null
  if (message !== null && typeof message !== 'string') return null

  return {
    ...value,
    status,
    keyword,
    startedAt: (startedAt as string | null | undefined) ?? null,
    thinkingEndsAt: (thinkingEndsAt as string | null | undefined) ?? null,
    message,
  }
}

// unknown payload를 안전하게 PvpSocketMessage union으로 변환한다.
export const parsePvpSocketMessage = (value: unknown): PvpSocketMessage | null => {
  // 객체가 아니면 파싱 불가
  if (!isRecord(value)) return null

  // 공통 필드를 로컬 변수로 분리한다.
  const type = value.type
  const roomId = value.roomId
  const message = value.message
  const timestamp = value.timestamp
  const data = value.data

  // 공통 필드 타입 검증
  if (typeof roomId !== 'number') return null
  if (!isNullableStringOrUndefined(message)) return null
  if (!isNullableNumberOrUndefined(timestamp)) return null

  // type별 data 파싱
  if (type === 'ROOM_JOINED' || type === 'ROOM_LEFT' || type === 'PLAYER_READY') {
    const parsedData = parseParticipantEventData(data)
    if (!parsedData) return null

    return {
      type,
      roomId,
      data: parsedData,
      message: (message as string | null | undefined) ?? null,
      timestamp: (timestamp as number | null | undefined) ?? null,
    }
  }

  if (type === 'STATUS_CHANGE') {
    const parsedData = parseStatusChangeData(data)
    if (!parsedData) return null

    return {
      type,
      roomId,
      data: parsedData,
      message: (message as string | null | undefined) ?? null,
      timestamp: (timestamp as number | null | undefined) ?? null,
    }
  }

  if (type === 'ANSWER_SUBMITTED') {
    const parsedData = parseParticipantEventData(data)
    if (!parsedData) return null

    return {
      type,
      roomId,
      data: parsedData,
      message: (message as string | null | undefined) ?? null,
      timestamp: (timestamp as number | null | undefined) ?? null,
    }
  }

  // 스펙에 없는 type은 무시한다.
  return null
}

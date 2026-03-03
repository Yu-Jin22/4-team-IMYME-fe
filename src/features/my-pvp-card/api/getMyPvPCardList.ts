import { proxyApiClient } from '@/shared/api'

export type MyPvPCardListRole = 'HOST' | 'GUEST'

export type MyPvPCardListSort = string

export type GetMyPvPCardListParams = {
  categoryId?: number
  keywordId?: number
  includeHidden?: boolean
  sort?: MyPvPCardListSort
  cursor?: number | string
  size?: number
}

export type MyPvPHistoryRoom = {
  id: number
  name: string
}

export type MyPvPHistorySubject = {
  id: number
  name: string
}

export type MyPvPHistoryMyResult = {
  score: number
  isWinner: boolean
}

export type MyPvPHistoryOpponent = {
  id: number
  nickname: string
  profileImageUrl: string
  score: number
}

export type MyPvPHistoryItem = {
  historyId: number
  room: MyPvPHistoryRoom
  category: MyPvPHistorySubject
  keyword: MyPvPHistorySubject
  myRole: MyPvPCardListRole
  myResult: MyPvPHistoryMyResult
  opponent: MyPvPHistoryOpponent
  isHidden: boolean
  finishedAt: string
}

export type MyPvPHistoryListMeta = {
  size: number
  hasNext: boolean
  nextCursor: string | null
}

export type MyPvPHistoryListData = {
  histories: MyPvPHistoryItem[]
  meta: MyPvPHistoryListMeta
}

type GetMyPvPCardListResponse = {
  success?: boolean
  data?: MyPvPHistoryListData
  message?: string
  timestamp?: string
}

export type GetMyPvPCardListResult =
  | { ok: true; data: MyPvPHistoryListData }
  | { ok: false; reason: string }

const MY_PVP_HISTORY_PROXY_PATH = '/proxy-api/pvp/histories'

export async function getMyPvPCardList(
  params: GetMyPvPCardListParams = {},
): Promise<GetMyPvPCardListResult> {
  try {
    const response = await proxyApiClient.get<GetMyPvPCardListResponse>(MY_PVP_HISTORY_PROXY_PATH, {
      params: {
        ...(params.categoryId !== undefined ? { categoryId: params.categoryId } : {}),
        ...(params.keywordId !== undefined ? { keywordId: params.keywordId } : {}),
        ...(params.includeHidden !== undefined ? { includeHidden: params.includeHidden } : {}),
        ...(params.sort !== undefined ? { sort: params.sort } : {}),
        ...(params.cursor !== undefined ? { cursor: params.cursor } : {}),
        ...(params.size !== undefined ? { size: params.size } : {}),
      },
    })
    const payload = response.data
    const historyListData = payload.data
    if (!historyListData) {
      return { ok: false, reason: 'empty_histories' }
    }

    return { ok: true, data: historyListData }
  } catch (error) {
    console.error('Failed to fetch my pvp history list', error)
    return { ok: false, reason: 'request_failed' }
  }
}

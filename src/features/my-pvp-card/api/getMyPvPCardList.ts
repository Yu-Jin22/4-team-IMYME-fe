import { httpClient } from '@/shared'

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

export type MyPvPHistoryItem = {
  id: number
  roomId: number
  categoryName: string
  keywordName: string
  myRole: MyPvPCardListRole
  myScore: number
  myLevel: number
  opponentNickname: string
  opponentScore: number
  isWinner: boolean
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

export async function getMyPvPCardList(
  accessToken: string,
  params: GetMyPvPCardListParams = {},
): Promise<GetMyPvPCardListResult> {
  try {
    const response = await httpClient.get<GetMyPvPCardListResponse>('/pvp/histories', {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
      params: {
        ...(params.categoryId !== undefined ? { categoryId: params.categoryId } : {}),
        ...(params.keywordId !== undefined ? { keywordId: params.keywordId } : {}),
        ...(params.includeHidden !== undefined ? { includeHidden: params.includeHidden } : {}),
        ...(params.sort !== undefined ? { sort: params.sort } : {}),
        ...(params.cursor !== undefined ? { cursor: params.cursor } : {}),
        ...(params.size !== undefined ? { size: params.size } : {}),
      },
    })

    const historyListData = response.data?.data
    if (!historyListData) {
      return { ok: false, reason: 'empty_histories' }
    }

    return { ok: true, data: historyListData }
  } catch (error) {
    console.error('Failed to fetch my pvp history list', error)
    return { ok: false, reason: 'request_failed' }
  }
}

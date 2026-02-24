'use client'

import { useRouter } from 'next/navigation'

import { CategoryItemType } from '@/entities/category'
import { KeywordItemType } from '@/entities/keyword'
import { PvPCard } from '@/entities/pvp-card'
import { useAccessToken } from '@/features/auth'
import { useMyPvPCardList } from '@/features/my-pvp-card'
import { StatusMessage } from '@/shared'

import type { MyPvPHistoryItem } from '@/features/my-pvp-card'

const LIST_CLASSNAME = 'mt-4 flex max-h-[60vh] min-h-0 flex-col items-center gap-4 overflow-y-auto'
const LOADING_MESSAGE = '대결 기록을 불러오는 중입니다...'
const ERROR_MESSAGE = '대결 기록을 불러오지 못했습니다.'
const EMPTY_MESSAGE = '대결 기록이 없습니다.'
const EMPTY_FILTERED_MESSAGE = '조건에 맞는 대결 기록이 없습니다.'

const getHistoryItems = (histories: MyPvPHistoryItem[]) => histories

type MyPvPCardListProps = {
  selectedCategory: CategoryItemType | null
  selectedKeyword: KeywordItemType | null
}
export function MyPvPCardList({ selectedCategory, selectedKeyword }: MyPvPCardListProps) {
  const router = useRouter()
  const accessToken = useAccessToken()
  const hasFilteringCondition = Boolean(selectedCategory) || Boolean(selectedKeyword)
  const myPvPCardListQuery = useMyPvPCardList(accessToken, {
    ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
    ...(selectedKeyword ? { keywordId: selectedKeyword.id } : {}),
  })

  if (myPvPCardListQuery.isLoading) {
    return <StatusMessage message={LOADING_MESSAGE} />
  }

  if (myPvPCardListQuery.isError || myPvPCardListQuery.data?.ok === false) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  const historyItems = myPvPCardListQuery.data?.ok
    ? getHistoryItems(myPvPCardListQuery.data.data.histories)
    : []

  if (historyItems.length === 0) {
    return (
      <StatusMessage message={hasFilteringCondition ? EMPTY_FILTERED_MESSAGE : EMPTY_MESSAGE} />
    )
  }

  return (
    <div className={LIST_CLASSNAME}>
      {historyItems.map((history) => (
        <PvPCard
          key={history.id}
          title={`${history.categoryName} 대결`}
          resultVariant={history.isWinner ? 'win' : 'lose'}
          categoryName={history.categoryName}
          keywordName={history.keywordName}
          opponentName={history.opponentNickname}
          onClick={() => router.push(`/mypage/pvps/${history.roomId}`)}
        />
      ))}
    </div>
  )
}

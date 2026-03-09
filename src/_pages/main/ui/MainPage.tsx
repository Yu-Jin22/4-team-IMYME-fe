import dynamic from 'next/dynamic'

import { ModeButton } from '@/features/mode'
import { RecentListHeader } from '@/shared'

import { ChallengeRankingCard } from '@/features/challenge'

const RecentCardListLazy = dynamic(
  () => import('@/widgets/recent-card').then((module) => module.RecentCardList),
  {
    loading: () => <p className="mt-10 text-center">최근 학습 목록을 불러오는 중입니다.</p>,
  },
)

const RecentPvPListLazy = dynamic(
  () => import('@/widgets/recent-pvp').then((module) => module.RecentPvPList),
  {
    loading: () => <p className="mt-10 text-center">최근 대결 목록을 불러오는 중입니다.</p>,
  },
)

export function MainPage() {
  return (
    <div className="flex w-full flex-1 flex-col pb-6">
      <div className="mt-10 flex flex-col gap-6 pb-5">
        {/* 학습/대결 모드 버튼 */}
        <ModeButton variant="levelup" />
        <ModeButton variant="pvp" />
        {process.env.NEXT_PUBLIC_CHALLENGE_OPEN === 'true' ? (
          <ModeButton variant="challenge" />
        ) : null}
      </div>
      {/*챌린지 랭킹*/}
      {process.env.NEXT_PUBLIC_CHALLENGE_OPEN === 'true' ? <ChallengeRankingCard /> : null}
      {/* 최근 학습 목록 */}
      <RecentListHeader variant="levelup" />
      <RecentCardListLazy />
      <RecentListHeader variant="pvp" />
      <RecentPvPListLazy />
      {process.env.NEXT_PUBLIC_CHALLENGE_OPEN !== 'true' ? null : <>{/* 최근 대결 목록 */}</>}
    </div>
  )
}

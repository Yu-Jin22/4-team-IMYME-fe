import dynamic from 'next/dynamic'

import { ChallengeRankingCard } from '@/features/challenge'
import { ModeButton } from '@/features/mode'
import { RecentListHeader } from '@/shared'

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

type MainPageProps = {
  isChallengeOpen: boolean
}

export function MainPage({ isChallengeOpen }: MainPageProps) {
  const shouldRenderChallengeMode = process.env.NEXT_PUBLIC_CHALLENGE_OPEN === 'true'

  return (
    <div className="flex w-full flex-1 flex-col pb-6">
      <div className="mt-10 flex flex-col gap-6 pb-5">
        {/* 학습/대결 모드 버튼 */}
        <ModeButton variant="levelup" />
        <ModeButton variant="pvp" />
        {shouldRenderChallengeMode ? (
          <ModeButton
            variant="challenge"
            disabled={!isChallengeOpen}
          />
        ) : null}
      </div>
      {/*챌린지 랭킹*/}
      {shouldRenderChallengeMode ? <ChallengeRankingCard /> : null}
      {/* 최근 학습 목록 */}
      <RecentListHeader variant="levelup" />
      <RecentCardListLazy />
      <RecentListHeader variant="pvp" />
      <RecentPvPListLazy />
      {shouldRenderChallengeMode ? <>{/* 최근 대결 목록 */}</> : null}
    </div>
  )
}

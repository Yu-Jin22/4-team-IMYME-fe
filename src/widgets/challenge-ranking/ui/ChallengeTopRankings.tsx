import { ChallengeRankingItem } from '@/features/challenge'

const CHALLENGE_TOP_RANKERS = [
  { variant: '1st', nickname: '말하는 감자', profileImageUrl: null },
  { variant: '2nd', nickname: '문제 해결사', profileImageUrl: null },
  { variant: '3rd', nickname: '코드 장인', profileImageUrl: null },
] as const

export function ChallengeTopRankings() {
  return CHALLENGE_TOP_RANKERS.map((rankingItem) => (
    <ChallengeRankingItem
      key={rankingItem.variant}
      variant={rankingItem.variant}
      nickname={rankingItem.nickname}
      profileImageUrl={rankingItem.profileImageUrl}
    />
  ))
}

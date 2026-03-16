'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ChallengeFeedbackPanel } from '@/features/challenge/ui/ChallengeFeedbackPanel'
import { ChallengeKeywordCard } from '@/features/challenge/ui/ChallengeKeywordCard'
import { Button, ModeHeader } from '@/shared'
import { ChallengeTopRankings } from '@/widgets/challenge-ranking'

type ChallengeFeedbackJson = {
  summary: string
  keywords: string
  facts: string
  understanding: string
  comparisonFeedback: string
}

const CHALLENGE_FEEDBACK_MOCK_JSON: ChallengeFeedbackJson = {
  summary:
    '핵심 개념 정의가 정확하고 예시를 짧게 붙여 이해를 도왔습니다. 결론 문장이 명확해 전달력이 좋았습니다.',
  keywords: 'JWT, Access Token, Refresh Token, 만료 시간, 서명',
  facts:
    'JWT는 header.payload.signature 구조이며, 서버는 서명 검증으로 무결성을 확인합니다. 토큰 만료는 exp 클레임으로 관리됩니다.',
  understanding:
    '개념 이해도는 높습니다. 다만 토큰 탈취 대응(저장 위치/재발급 전략)까지 함께 언급하면 실무 완성도가 더 올라갑니다.',
  comparisonFeedback:
    '상위 랭커는 동일 주제를 설명할 때 공격 시나리오와 방어 전략을 짝으로 말해 설득력이 높았습니다.',
}

const MOSAIC_BACKGROUND_STYLE = {
  backgroundImage:
    'linear-gradient(45deg, rgba(255,255,255,0.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.35) 75%, transparent 75%, transparent)',
  backgroundSize: '20px 20px',
} as const

export function ChallengeRankingPage() {
  const [showFeedback, setShowFeedback] = useState(false)
  // TODO: 추후 API 응답 값으로 교체
  const [hasParticipatedInChallenge] = useState(true)
  const router = useRouter()
  const handleBack = () => {
    router.back()
  }
  const handleClickShowFeedback = () => {
    setShowFeedback(true)
  }

  const renderFeedbackSection = () => {
    if (showFeedback && hasParticipatedInChallenge) {
      return <ChallengeFeedbackPanel feedback={CHALLENGE_FEEDBACK_MOCK_JSON} />
    }

    if (hasParticipatedInChallenge) {
      return (
        <div
          className="bg-secondary flex h-90 w-90 items-center justify-center rounded-xl"
          style={MOSAIC_BACKGROUND_STYLE}
        >
          <Button
            variant="ranking_show_feedback_btn"
            onClick={handleClickShowFeedback}
          >
            피드백 보기
          </Button>
        </div>
      )
    }

    return (
      <div
        className="bg-secondary flex h-90 w-90 items-center justify-center rounded-xl"
        style={MOSAIC_BACKGROUND_STYLE}
      >
        <p className="text-sm font-semibold">챌린지 미참여자에게는 피드백이 제공되지 않습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <ModeHeader
        mode="challenge"
        step="ranking"
        onBack={handleBack}
      />
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="border-primary flex h-22.5 w-80 flex-col items-center justify-center gap-4 rounded-xl border shadow-[0_-2px_1px_rgba(255,255,255,1),0_2px_1px_rgba(0,0,0,0.1)]">
          <p className="text-sm">나의 랭킹</p>
          <p className="text-lg font-semibold">54위</p>
        </div>
        <ChallengeKeywordCard
          variant="yesterday"
          keyword="JWT"
        />
        <ChallengeTopRankings />
        {renderFeedbackSection()}
      </div>
    </div>
  )
}

'use client'
import { useRouter } from 'next/navigation'

import { ModeHeader } from '@/shared'

export function ChallengeRankingPage() {
  const router = useRouter()
  const handleBack = () => {
    router.back()
  }
  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <ModeHeader
        mode="challenge"
        step="ranking"
        onBack={handleBack}
      />
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="border-primary flex h-22.5 w-80 flex-col items-center justify-center gap-4 rounded-xl border">
          <p className="text-sm">나의 랭킹</p>
          <p className="text-lg font-semibold">54위</p>
        </div>
      </div>
      <div className="bg-secondary flex h-22.5 w-80 flex-col items-center justify-center gap-2 self-center rounded-xl">
        <p className="text-sm">어제의 키워드</p>
        <p className="text-lg font-semibold">JWT</p>
      </div>
    </div>
  )
}

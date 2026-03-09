'use client'
import { ModeHeader } from '@/shared'

export function ChallengePage() {
  return (
    <div className="h-full w-full">
      <ModeHeader
        mode="challenge"
        step="waiting"
        title=""
        onBack={() => {}}
      />
    </div>
  )
}

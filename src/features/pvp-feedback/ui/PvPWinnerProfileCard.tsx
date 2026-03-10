'use client'

import type { ReactNode } from 'react'

const WRAPPER_CLASSNAME =
  'bg-secondary flex w-80 flex-col items-center justify-center gap-2 self-center rounded-2xl px-5 py-5'
const WIN_LABEL = 'Win!'
const NO_WINNER_LABEL = 'NO WINNER'

type PvPWinnerProfileCardVariant = 'winner' | 'no_winner'

type PvPWinnerProfileCardProps = {
  profile: ReactNode
  variant?: PvPWinnerProfileCardVariant
}

export function PvPWinnerProfileCard({ profile, variant = 'winner' }: PvPWinnerProfileCardProps) {
  const resolvedLabel = variant === 'no_winner' ? NO_WINNER_LABEL : WIN_LABEL

  return (
    <div className={WRAPPER_CLASSNAME}>
      {profile}
      <p className="font-semibold">{resolvedLabel}</p>
    </div>
  )
}

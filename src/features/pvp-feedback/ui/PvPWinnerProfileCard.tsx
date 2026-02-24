'use client'

import type { ReactNode } from 'react'

const WRAPPER_CLASSNAME =
  'bg-secondary mt-5 flex w-80 flex-col items-center justify-center gap-2 self-center rounded-2xl px-5 py-5'
const DEFAULT_WIN_LABEL = 'Win!'

type PvPWinnerProfileCardProps = {
  profile: ReactNode
  winLabel?: string
}

export function PvPWinnerProfileCard({
  profile,
  winLabel = DEFAULT_WIN_LABEL,
}: PvPWinnerProfileCardProps) {
  return (
    <div className={WRAPPER_CLASSNAME}>
      {profile}
      <p className="font-semibold">{winLabel}</p>
    </div>
  )
}

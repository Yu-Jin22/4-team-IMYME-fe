'use client'

import { useEffect, useState } from 'react'

const ONE_SECOND_MS = 1000
const ONE_MINUTE_SECONDS = 60
const TIME_PAD_LENGTH = 2
const COUNTDOWN_TICK_MS = 1000
const EMPTY_COUNTDOWN_LABEL = '\u00A0'
const COUNTDOWN_SLOT_CLASSNAME = 'h-5 w-full'
const COUNTDOWN_TEXT_CLASSNAME = 'text-primary text-center text-sm font-semibold'
const COUNTDOWN_TEXT_HIDDEN_CLASSNAME = 'invisible text-center text-sm font-semibold'

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / ONE_SECOND_MS))
  const minutes = Math.floor(totalSeconds / ONE_MINUTE_SECONDS)
  const seconds = totalSeconds % ONE_MINUTE_SECONDS

  return `${minutes}:${String(seconds).padStart(TIME_PAD_LENGTH, '0')}`
}

type PvPThinkingCountdownProps = {
  isThinkingStep: boolean
  thinkingEndsAtMs: number | null
}

export function PvPThinkingCountdown({
  isThinkingStep,
  thinkingEndsAtMs,
}: PvPThinkingCountdownProps) {
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!isThinkingStep || !thinkingEndsAtMs) return

    const syncNowTimerId = window.setTimeout(() => {
      setCountdownNowMs(Date.now())
    }, 0)

    const timerId = window.setInterval(() => {
      setCountdownNowMs(Date.now())
    }, COUNTDOWN_TICK_MS)

    return () => {
      window.clearTimeout(syncNowTimerId)
      window.clearInterval(timerId)
    }
  }, [isThinkingStep, thinkingEndsAtMs])

  const hasThinkingEndsAtMs = typeof thinkingEndsAtMs === 'number'
  const remainingMs = hasThinkingEndsAtMs ? thinkingEndsAtMs - countdownNowMs : 0
  const shouldShowCountdown = isThinkingStep && hasThinkingEndsAtMs && remainingMs > 0
  const countdownLabel = shouldShowCountdown
    ? `남은 생각 시간 ${formatCountdown(remainingMs)}`
    : EMPTY_COUNTDOWN_LABEL
  const countdownTextClassName = shouldShowCountdown
    ? COUNTDOWN_TEXT_CLASSNAME
    : COUNTDOWN_TEXT_HIDDEN_CLASSNAME

  return (
    <div className={COUNTDOWN_SLOT_CLASSNAME}>
      <p className={countdownTextClassName}>{countdownLabel}</p>
    </div>
  )
}

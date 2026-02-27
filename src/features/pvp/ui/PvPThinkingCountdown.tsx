'use client'

import { useEffect, useState } from 'react'

const ONE_SECOND_MS = 1000
const ONE_MINUTE_SECONDS = 60
const TIME_PAD_LENGTH = 2
const COUNTDOWN_TICK_MS = 1000

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

    const timerId = window.setInterval(() => {
      setCountdownNowMs(Date.now())
    }, COUNTDOWN_TICK_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [isThinkingStep, thinkingEndsAtMs])

  if (!isThinkingStep || !thinkingEndsAtMs) return null

  const remainingMs = thinkingEndsAtMs - countdownNowMs
  if (remainingMs <= 0) return null

  return (
    <p className="text-primary text-center text-sm font-semibold">
      남은 생각 시간 {formatCountdown(remainingMs)}
    </p>
  )
}

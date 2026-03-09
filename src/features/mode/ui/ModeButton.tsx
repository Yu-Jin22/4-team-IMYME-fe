'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button, type ButtonProps } from '@/shared/ui/button'

const MODE_BUTTON_VARIANTS = {
  levelup: {
    icon: '📝',
    label: '레벨업 모드',
  },
  pvp: {
    icon: '⚔️',
    label: 'PVP 모드',
  },
  challenge: {
    icon: '🔥',
    label: '챌린지 모드',
  },
} as const

type ModeButtonVariant = keyof typeof MODE_BUTTON_VARIANTS

type ModeButtonProps = {
  variant?: ModeButtonVariant
} & Omit<ButtonProps, 'variant' | 'children'>

const CHALLENGE_OPEN_HOUR = 22
const CHALLENGE_OPEN_MINUTE = 0
const CHALLENGE_CLOSE_MINUTE = 10
const CHALLENGE_UNAVAILABLE_TOAST_MESSAGE = '챌린지는 매일 22:00~22:10에만 참여할 수 있습니다.'

const isChallengeOpenNow = (now: Date) => {
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  if (currentHour !== CHALLENGE_OPEN_HOUR) return false
  if (currentMinute < CHALLENGE_OPEN_MINUTE) return false
  return currentMinute <= CHALLENGE_CLOSE_MINUTE
}

export function ModeButton({ variant = 'levelup', ...props }: ModeButtonProps) {
  const { icon, label } = MODE_BUTTON_VARIANTS[variant]
  const router = useRouter()

  return (
    <Button
      variant={'mode_btn_primary'}
      onClick={() => {
        if (variant === 'challenge' && !isChallengeOpenNow(new Date())) {
          toast.info(CHALLENGE_UNAVAILABLE_TOAST_MESSAGE)
          return
        }
        router.push(`/${variant}`)
      }}
      {...props}
    >
      <span className="ml-4 text-5xl">{icon}</span>
      <span className="text-md mr-4 ml-auto font-semibold">{label}</span>
    </Button>
  )
}

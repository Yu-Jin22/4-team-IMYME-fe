'use client'

import { Button } from '@/shared'

type RoomCreateButtonVariant = 'category' | 'create' | 'waiting' | 'complete'

type RoomCreateButtonProps = {
  variant: RoomCreateButtonVariant
  disabled?: boolean
  onClick?: () => void
}

const LABEL_BY_VARIANT: Record<RoomCreateButtonVariant, string> = {
  category: '다음',
  create: '방 만들기',
  waiting: '매칭 대기 중',
  complete: '곧 대결이 시작됩니다.',
}

const WRAPPER_CLASSNAME = 'mt-auto flex w-full justify-center pb-6'
const BUTTON_SIZE_CLASSNAME = 'h-10 w-87.5 max-w-87.5'
const DEFAULT_BUTTON_TONE_CLASSNAME = 'bg-secondary text-primary'
const ENABLED_CREATE_BUTTON_TONE_CLASSNAME =
  'bg-primary text-primary-foreground hover:bg-primary/90'

export function RoomCreateButton({ variant, disabled, onClick }: RoomCreateButtonProps) {
  const isCreateActionEnabled = variant === 'create' && !disabled
  const buttonToneClassName = isCreateActionEnabled
    ? ENABLED_CREATE_BUTTON_TONE_CLASSNAME
    : DEFAULT_BUTTON_TONE_CLASSNAME

  return (
    <div className={WRAPPER_CLASSNAME}>
      <Button
        className={`${BUTTON_SIZE_CLASSNAME} ${buttonToneClassName}`}
        disabled={disabled}
        onClick={onClick}
      >
        {LABEL_BY_VARIANT[variant]}
      </Button>
    </div>
  )
}

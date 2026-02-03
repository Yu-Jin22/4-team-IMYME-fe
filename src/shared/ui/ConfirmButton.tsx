'use client'

import { Button } from './button'

type ConfirmButtonProps = {
  onClick?: () => void
  disabled?: boolean
}

export function ConfirmButton({ onClick, disabled = false }: ConfirmButtonProps) {
  return (
    <Button
      type="button"
      variant="confirm_btn_primary"
      onClick={onClick}
      disabled={disabled}
    >
      확인
    </Button>
  )
}

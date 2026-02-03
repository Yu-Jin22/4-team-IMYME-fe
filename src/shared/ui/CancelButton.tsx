'use client'

import { Button } from './button'

type CancelButtonProps = {
  onClick: () => void
}

export function CancelButton({ onClick }: CancelButtonProps) {
  return (
    <Button
      type="button"
      variant="cancel_btn_primary"
      onClick={onClick}
    >
      취소
    </Button>
  )
}

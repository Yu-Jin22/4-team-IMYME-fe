import { Button } from '@/shared/ui/button'

import type { ComponentProps } from 'react'

type ProfileEditTryButtonProps = ComponentProps<typeof Button>
export function ProfileEditTryButton(props: ProfileEditTryButtonProps) {
  return (
    <Button
      variant={'modal_btn_primary'}
      {...props}
    >
      수정하기
    </Button>
  )
}

'use client'

import { type ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'

import { HelpButton } from '../HelpButton'
import { LogoutButton } from '../LogoutButton'
import { ProfileEditButton } from '../ProfileEditButton'

import { NotificationSettingField } from './NotificationSettingField'

const MODAL_CONTENT_CLASS =
  'sm:max-w-[320px] min-h-[270px] flex flex-col items-center justify-between'

type MenuModalProps = {
  trigger: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onClickProfileEdit: () => void
}

export function MenuModal({ trigger, open, onOpenChange, onClickProfileEdit }: MenuModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={MODAL_CONTENT_CLASS}>
        <DialogTitle>설정</DialogTitle>
        <DialogDescription></DialogDescription>
        <ProfileEditButton
          type="button"
          variant="modal_btn_primary"
          onClick={onClickProfileEdit}
        />
        <HelpButton />
        <LogoutButton />
        <NotificationSettingField />
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { ProfileDashboard } from '@/widgets/profile'

import { MenuVisibleLayout } from './MenuVisibleLayout'

import type { ReactNode } from 'react'

type ProfilePagesLayoutProps = {
  children: ReactNode
}

const CONTENT_CLASSNAME = 'flex w-full flex-1 flex-col'

export function ProfilePagesLayout({ children }: ProfilePagesLayoutProps) {
  return (
    <MenuVisibleLayout>
      <div className={CONTENT_CLASSNAME}>
        <ProfileDashboard deferAvatarImageUntilProfileReady={true} />
        {children}
      </div>
    </MenuVisibleLayout>
  )
}

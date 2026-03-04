'use client'

import { ProfileDashboard } from '@/widgets/profile'

import { MenuVisibleLayout } from './MenuVisibleLayout'

import type { UserProfile } from '@/entities/user'
import type { ReactNode } from 'react'

type ProfilePagesLayoutProps = {
  children: ReactNode
  initialProfile?: UserProfile | null
}

const CONTENT_CLASSNAME = 'flex w-full flex-1 flex-col'

export function ProfilePagesLayout({ children, initialProfile }: ProfilePagesLayoutProps) {
  return (
    <MenuVisibleLayout>
      <div className={CONTENT_CLASSNAME}>
        {/* main/mypage 공통 프로필 영역은 서버가 먼저 준 초기 프로필을 즉시 사용한다. */}
        <ProfileDashboard initialProfile={initialProfile} />
        {children}
      </div>
    </MenuVisibleLayout>
  )
}

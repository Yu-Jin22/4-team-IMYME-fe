import { cookies } from 'next/headers'

import { getInitialMyProfile } from '@/entities/user'
import { ACCESS_TOKEN_COOKIE } from '@/features/auth/server'
import { ProfilePagesLayout } from '@/widgets/layouts'

import type { ReactNode } from 'react'

type ProfilePagesRouteLayoutProps = {
  children: ReactNode
}

const getInitialProfile = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? ''
  if (!accessToken) {
    return null
  }

  // 서버 레이아웃은 refresh가 끝난 access token cookie만 사용해 초기 프로필을 만든다.
  const profileResult = await getInitialMyProfile(accessToken)
  if (!profileResult.ok) {
    return null
  }

  return profileResult.profile
}

export default async function ProfilePagesRouteLayout({ children }: ProfilePagesRouteLayoutProps) {
  // main/mypage 최초 HTML에는 서버가 선조회한 프로필을 바로 주입한다.
  const initialProfile = await getInitialProfile()

  return <ProfilePagesLayout initialProfile={initialProfile}>{children}</ProfilePagesLayout>
}

'use client'

import { ChevronLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import {
  Avatar,
  Nickname,
  StatCards,
  useMyProfileQuery,
  useProfile,
  useSyncMyProfile,
} from '@/entities/user'
import { useAccessToken } from '@/features/auth'

const AVATAR_SIZE_PX = 60
const FALLBACK_NICKNAME = '로딩중...'
const FALLBACK_STAT_VALUE = 0
const MAIN_PAGE_PATH = '/main'
const MY_PAGE_PATH = '/mypage'

interface ProfileDashboardProps {
  deferAvatarImageUntilProfileReady?: boolean
}

export function ProfileDashboard({
  deferAvatarImageUntilProfileReady = false,
}: ProfileDashboardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAccessToken()
  const profile = useProfile()
  const { data: myProfile } = useMyProfileQuery(accessToken, { enabled: Boolean(accessToken) })
  useSyncMyProfile({ accessToken, myProfile })

  const isMainPage = pathname === MAIN_PAGE_PATH
  const isMyPage = pathname === MY_PAGE_PATH
  const isProfileReady = Boolean(profile.nickname || profile.profileImageUrl)
  const shouldDeferAvatarImage = deferAvatarImageUntilProfileReady && !myProfile
  const avatarSrcForRender = shouldDeferAvatarImage
    ? ''
    : (myProfile?.profileImageUrl ?? profile.profileImageUrl)

  return (
    <div className="relative w-full">
      <div
        className={['absolute rounded-md p-1', isMyPage ? '' : 'invisible'].join(' ')}
        onClick={() => {
          router.push('/main')
        }}
      >
        <ChevronLeft />
      </div>

      <div
        className="w-full cursor-pointer"
        onClick={() => {
          if (isMainPage) router.push('/mypage')
        }}
      >
        {/* 프로필 요약 */}
        <div className="grid w-full auto-cols-max grid-flow-col items-start gap-4">
          <div
            className="ml-10 overflow-hidden rounded-full"
            style={{ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX }}
          >
            <Avatar
              avatar_src={avatarSrcForRender}
              size={AVATAR_SIZE_PX}
            />
          </div>
          <Nickname nickname={isProfileReady ? profile.nickname : FALLBACK_NICKNAME} />
        </div>

        <StatCards
          cardCount={isProfileReady ? profile.activeCardCount : FALLBACK_STAT_VALUE}
          winCount={isProfileReady ? profile.winCount : FALLBACK_STAT_VALUE}
          levelCount={isProfileReady ? profile.level : FALLBACK_STAT_VALUE}
        />
      </div>
    </div>
  )
}

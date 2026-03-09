'use client'

import { useEffect } from 'react'

import { useProfile, useSetProfile } from './useUserStore'

import type { UserProfile } from './userProfile'

type UseSyncMyProfileParams = {
  myProfile?: UserProfile
  initialProfile?: UserProfile | null
}

export function useSyncMyProfile({ myProfile, initialProfile }: UseSyncMyProfileParams) {
  const profile = useProfile()
  const setProfile = useSetProfile()
  // client query가 있으면 그 값을 우선하고, 없으면 서버 주입값을 fallback으로 동기화한다.
  const profileToSync = myProfile ?? initialProfile

  const stripQuery = (url: string) => {
    if (!url) return ''
    try {
      const normalizedUrl = new URL(url)
      return `${normalizedUrl.origin}${normalizedUrl.pathname}`
    } catch {
      return url.split('?')[0]
    }
  }

  const hasSameProfileFields =
    profile.id === profileToSync?.id &&
    profile.nickname === profileToSync?.nickname &&
    profile.level === profileToSync?.level &&
    profile.activeCardCount === profileToSync?.activeCardCount &&
    profile.consecutiveDays === profileToSync?.consecutiveDays &&
    profile.winCount === profileToSync?.winCount

  // store 동기화는 "필요할 때만" (그리고 같은 값이면 안 넣기)
  useEffect(() => {
    // query 값이나 서버 주입값이 없으면 동기화하지 않음
    if (!profileToSync) return
    // 이미 같은 프로필이면 불필요한 상태 업데이트 방지
    const curBase = stripQuery(profile.profileImageUrl)
    const nextBase = stripQuery(profileToSync.profileImageUrl)
    const hasSameImageBase = Boolean(curBase) && curBase === nextBase

    // 프로필의 실질 데이터와 이미지 파일 base가 모두 같을 때만 store 업데이트를 생략한다.
    if (hasSameProfileFields && hasSameImageBase) {
      return
    }

    // 같은 파일의 presigned URL만 바뀐 경우에는 기존 URL을 유지해 불필요한 src swap을 줄인다.
    setProfile({
      ...profileToSync,
      profileImageUrl: hasSameImageBase ? profile.profileImageUrl : profileToSync.profileImageUrl,
    })
  }, [hasSameProfileFields, profile.profileImageUrl, profileToSync, setProfile])
}

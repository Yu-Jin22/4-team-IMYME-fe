import { httpClient } from '@/shared/api'

import type { UserProfile } from '../model/userProfile'

type GetInitialMyProfileSuccess = {
  ok: true
  profile: UserProfile
}

type GetInitialMyProfileFailure = {
  ok: false
  reason: 'missing_access_token' | 'request_failed' | 'empty_profile'
}

export type GetInitialMyProfileResult = GetInitialMyProfileSuccess | GetInitialMyProfileFailure

type MyProfileResponse = {
  data?: UserProfile
}

export const getInitialMyProfile = async (
  accessToken: string,
): Promise<GetInitialMyProfileResult> => {
  if (!accessToken) {
    return { ok: false, reason: 'missing_access_token' }
  }

  try {
    // 서버 렌더에서는 access token cookie를 읽어 바로 /users/me를 조회한다.
    const response = await httpClient.get<MyProfileResponse>('/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const profile = response.data?.data
    if (!profile) {
      return { ok: false, reason: 'empty_profile' }
    }

    return { ok: true, profile }
  } catch {
    return { ok: false, reason: 'request_failed' }
  }
}

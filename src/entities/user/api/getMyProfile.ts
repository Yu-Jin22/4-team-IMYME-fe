import { proxyApiClient } from '@/shared/api'

import type { UserProfile } from '../model/userProfile'

type GetMyProfileResponse = {
  data?: UserProfile
}

type GetMyProfileResult = { ok: true; data: UserProfile } | { ok: false; reason: string }

const MY_PROFILE_PROXY_PATH = '/proxy-api/users/me'

export async function getMyProfile(): Promise<GetMyProfileResult> {
  try {
    const response = await proxyApiClient.get<GetMyProfileResponse>(MY_PROFILE_PROXY_PATH)
    const payload = response.data
    const profile = payload.data
    if (!profile) {
      return { ok: false, reason: 'empty_profile' }
    }

    return { ok: true, data: profile }
  } catch (error) {
    console.error('Failed to fetch profile', error)
    return { ok: false, reason: 'request_failed' }
  }
}

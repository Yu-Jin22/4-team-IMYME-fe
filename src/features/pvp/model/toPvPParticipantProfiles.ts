import { PVP_MATCHING_EMPTY_GUEST_NAME } from './pvpMatchingConstants'

import type { PvPCardDetails } from '@/entities/pvp-card'
import type { PvPRoomDetails } from '@/entities/room'

export type PvPParticipantProfile = {
  name: string
  avatarUrl?: string
}

type PvPParticipantProfiles = {
  leftProfile: PvPParticipantProfile
  rightProfile: PvPParticipantProfile
}

type PvPParticipantSource = PvPRoomDetails | PvPCardDetails

function isRoomDetails(source: PvPParticipantSource): source is PvPRoomDetails {
  return 'host' in source
}

export function toPvPParticipantProfiles(source: PvPParticipantSource): PvPParticipantProfiles {
  if (isRoomDetails(source)) {
    return {
      leftProfile: {
        name: source.host.nickname,
        avatarUrl: source.host.profileImageUrl,
      },
      rightProfile: {
        name: source.guest?.nickname ?? PVP_MATCHING_EMPTY_GUEST_NAME,
        avatarUrl: source.guest?.profileImageUrl ?? '',
      },
    }
  }

  return {
    leftProfile: {
      name: source.myResult?.user?.nickname ?? '',
      avatarUrl: source.myResult?.user?.profileImageUrl ?? '',
    },
    rightProfile: {
      name: source.opponentResult?.user?.nickname ?? '',
      avatarUrl: source.opponentResult?.user?.profileImageUrl ?? '',
    },
  }
}

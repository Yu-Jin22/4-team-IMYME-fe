'use client'

import { PvPProfile } from './PvPProfile'

import type { PvPParticipantProfile } from '../model/toPvPParticipantProfiles'

export type { PvPParticipantProfile } from '../model/toPvPParticipantProfiles'

type PvPParticipantsProps = {
  leftProfile: PvPParticipantProfile
  rightProfile: PvPParticipantProfile
  vsLabel?: string
}

const WRAPPER_CLASSNAME = 'flex w-full items-center justify-center gap-20'
const DEFAULT_VS_LABEL = 'VS'

export function PvPParticipants({
  leftProfile,
  rightProfile,
  vsLabel = DEFAULT_VS_LABEL,
}: PvPParticipantsProps) {
  return (
    <div className={WRAPPER_CLASSNAME}>
      <PvPProfile
        name={leftProfile.name}
        avatarUrl={leftProfile.avatarUrl}
      />
      <p>{vsLabel}</p>
      <PvPProfile
        name={rightProfile.name}
        avatarUrl={rightProfile.avatarUrl}
      />
    </div>
  )
}

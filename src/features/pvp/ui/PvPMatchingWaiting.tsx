'use client'

import { CircleCheckBig } from 'lucide-react'

import { Spinner } from '@/shared'

import { PVP_MATCHING_EMPTY_GUEST_NAME } from '../model/pvpMatchingConstants'

import { PvPParticipants } from './PvPParticipants'

import type { PvPParticipantProfile } from './PvPParticipants'

type PvPMatchingWaitingProps = {
  leftProfile: PvPParticipantProfile
  showSpinner?: boolean
}

const WRAPPER_CLASSNAME = 'mt-30 flex w-full flex-col gap-10'
const STATUS_WRAPPER_CLASSNAME = 'flex w-full flex-col items-center justify-center gap-4'
const SPINNER_WRAPPER_CLASSNAME =
  'bg-secondary flex h-20 w-20 items-center justify-center rounded-full'
const DEFAULT_WAITING_RIGHT_PROFILE: PvPParticipantProfile = {
  name: PVP_MATCHING_EMPTY_GUEST_NAME,
  avatarUrl: '',
}

export function PvPMatchingWaiting({ leftProfile, showSpinner = true }: PvPMatchingWaitingProps) {
  return (
    <div className={WRAPPER_CLASSNAME}>
      <div className={STATUS_WRAPPER_CLASSNAME}>
        <div className={SPINNER_WRAPPER_CLASSNAME}>
          {showSpinner ? <Spinner className="size-8" /> : <CircleCheckBig className="size-8" />}
        </div>
        <p className="text-sm">{showSpinner ? '상대를 기다리고 있습니다...' : '매칭 완료!'}</p>
      </div>
      <PvPParticipants
        leftProfile={leftProfile}
        rightProfile={DEFAULT_WAITING_RIGHT_PROFILE}
      />
    </div>
  )
}

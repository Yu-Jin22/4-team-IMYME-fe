'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/shared'

import type { KeyboardEvent } from 'react'

type RoomProps = {
  roomId: number
  title: string
  category: string
  participantsLabel: string
  hostName: string
  hostProfileImageUrl?: string
  onJoinRoom: (roomId: number) => void
}

const CARD_CLASSNAME =
  'border-secondary flex h-30 w-80 flex-col items-center justify-center gap-5 rounded-xl border'
const HEADER_ROW_CLASSNAME = 'flex w-full items-start justify-between px-4 pt-2'
const HOST_ROW_CLASSNAME = 'flex w-full items-center justify-between'
const HOST_INFO_CLASSNAME = 'flex items-center gap-2 pl-4'
const HOST_AVATAR_CLASSNAME = 'rounded-full bg-gray-300 object-cover h-10 w-10'
const ENTER_ICON_SIZE = 16

export function Room({
  roomId,
  title,
  category,
  participantsLabel,
  hostName,
  hostProfileImageUrl,
  onJoinRoom,
}: RoomProps) {
  const handleJoinRoom = () => {
    onJoinRoom(roomId)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    handleJoinRoom()
  }

  return (
    <div
      className={CARD_CLASSNAME}
      onClick={handleJoinRoom}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={HEADER_ROW_CLASSNAME}>
        <div className="items-start">
          <p className="font-semibold">{title}</p>
          <p className="text-xs">{category}</p>
        </div>
        <p className="text-sm">{participantsLabel}</p>
      </div>
      <div className={HOST_ROW_CLASSNAME}>
        <div className={HOST_INFO_CLASSNAME}>
          {hostProfileImageUrl ? (
            <Image
              src={hostProfileImageUrl}
              alt={`${hostName} profile`}
              className={HOST_AVATAR_CLASSNAME}
              width={40}
              height={40}
            />
          ) : (
            <div className={HOST_AVATAR_CLASSNAME}></div>
          )}
          <p className="text-sm">{hostName}</p>
        </div>
        <Button
          variant="pvp_room_enter_btn"
          onClick={(event) => {
            event.stopPropagation()
            handleJoinRoom()
          }}
        >
          <p className="text-sm">입장하기</p>
          <ArrowRight size={ENTER_ICON_SIZE} />
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Room } from '@/entities/room'
import { getPvPRoomJoinQueryKey, joinPvPRoom, useRoomList } from '@/features/pvp'
import { StatusMessage } from '@/shared'

import type { PvPRoomListItem } from '@/features/pvp'

const LIST_CLASSNAME = 'mt-5 flex w-full flex-col items-center justify-center gap-4'
const OPEN_ROOM_STATUS = 'OPEN' as const
const LOADING_MESSAGE = '매칭 방 목록을 불러오는 중입니다...'
const ERROR_MESSAGE = '매칭 방 목록을 불러오지 못했습니다.'
const EMPTY_MESSAGE = '참여 가능한 매칭 방이 없습니다.'
const JOIN_ERROR_MESSAGE = '매칭 방에 입장하지 못했습니다.'
const OPEN_PARTICIPANTS_LABEL = '1/2'
const FILLED_PARTICIPANTS_LABEL = '2/2'

const getParticipantsLabel = (room: PvPRoomListItem) =>
  room.status === OPEN_ROOM_STATUS ? OPEN_PARTICIPANTS_LABEL : FILLED_PARTICIPANTS_LABEL

type RoomListProps = {
  categoryId?: number
}

export function RoomList({ categoryId }: RoomListProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null)
  const roomListQuery = useRoomList({
    categoryId,
    status: OPEN_ROOM_STATUS,
  })

  const handleJoinRoom = async (roomId: number) => {
    if (joiningRoomId !== null) return

    setJoiningRoomId(roomId)
    const joinResult = await joinPvPRoom(roomId)
    setJoiningRoomId(null)

    if (!joinResult.ok) {
      toast.error(JOIN_ERROR_MESSAGE)
      return
    }

    queryClient.setQueryData(getPvPRoomJoinQueryKey(roomId), joinResult)
    router.push(`/pvp/matching/${roomId}`)
  }

  if (roomListQuery.isLoading) {
    return <StatusMessage message={LOADING_MESSAGE} />
  }

  if (roomListQuery.isError || roomListQuery.data?.ok === false) {
    return <StatusMessage message={ERROR_MESSAGE} />
  }

  const rooms = roomListQuery.data?.ok ? roomListQuery.data.data.rooms : []

  if (rooms.length === 0) {
    return <StatusMessage message={EMPTY_MESSAGE} />
  }

  return (
    <div className={LIST_CLASSNAME}>
      {rooms.map((room) => (
        <Room
          key={room.room.id}
          roomId={room.room.id}
          title={room.room.name}
          category={room.category.name}
          participantsLabel={getParticipantsLabel(room)}
          hostName={room.host.nickname}
          hostProfileImageUrl={room.host.profileImageUrl}
          onJoinRoom={(nextRoomId) => {
            if (joiningRoomId !== null && joiningRoomId !== nextRoomId) return

            void handleJoinRoom(nextRoomId)
          }}
        />
      ))}
    </div>
  )
}

'use client'

import { Room } from '@/entities/room'
import { useAccessToken } from '@/features/auth'
import { useRoomList } from '@/features/pvp'
import { StatusMessage } from '@/shared'

import type { PvPRoomListItem } from '@/features/pvp'

const LIST_CLASSNAME = 'mt-5 flex w-full flex-col items-center justify-center gap-4'
const OPEN_ROOM_STATUS = 'OPEN' as const
const LOADING_MESSAGE = '매칭 방 목록을 불러오는 중입니다...'
const ERROR_MESSAGE = '매칭 방 목록을 불러오지 못했습니다.'
const EMPTY_MESSAGE = '참여 가능한 매칭 방이 없습니다.'
const OPEN_PARTICIPANTS_LABEL = '1/2'
const FILLED_PARTICIPANTS_LABEL = '2/2'

const getParticipantsLabel = (room: PvPRoomListItem) =>
  room.status === OPEN_ROOM_STATUS ? OPEN_PARTICIPANTS_LABEL : FILLED_PARTICIPANTS_LABEL

export function RoomList() {
  const accessToken = useAccessToken()
  const roomListQuery = useRoomList(accessToken, { status: OPEN_ROOM_STATUS })

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
          key={room.id}
          title={room.roomName}
          category={room.categoryName}
          participantsLabel={getParticipantsLabel(room)}
          hostName={room.hostNickname}
          onEnter={() => {}}
        />
      ))}
    </div>
  )
}

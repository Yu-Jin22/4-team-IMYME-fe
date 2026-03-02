'use client'

import { usePvPRoomDetails } from '@/entities/room'
import { useMyProfileQuery, useUserId } from '@/entities/user'

import { usePvPRoomJoinQuery } from './usePvPRoomJoinQuery'

import type { PvPRoomDetails } from '@/entities/room'

const OPEN_ROOM_STATUS = 'OPEN'

export type PvPMatchingAccessState =
  | 'invalid_room_id'
  | 'loading'
  | 'fetch_error'
  | 'join_error'
  | 'access_denied'
  | 'ready'

type UsePvPMatchingAccessParams = {
  accessToken: string | null
  roomId: number
}

type UsePvPMatchingAccessResult = {
  // 현재 페이지 진입 상태를 한 값으로 표준화해 페이지 분기를 단순화한다.
  accessState: PvPMatchingAccessState
  // 현재 사용자 id(store 우선, 없으면 myProfile query fallback)
  myUserId: number | undefined
  // 서버 방 상세 또는 join 응답을 합친 최종 방 정보
  resolvedRoomDetails: PvPRoomDetails | null
  // 최종 방 id
  joinedRoomId: number | null
  // 실제 참가자일 때만 노출하는 room id
  participantRoomId: number | null
  // join 실패/접근 거부 시 3초 후 목록으로 보내는 트리거
  shouldRedirectToRooms: boolean
}

export function usePvPMatchingAccess({
  accessToken,
  roomId,
}: UsePvPMatchingAccessParams): UsePvPMatchingAccessResult {
  // URL 파라미터가 숫자가 아니면 이후 query 실행 자체를 막아야 한다.
  const isInvalidRoomId = Number.isNaN(roomId)

  // 유저 id는 store가 우선이고, 없는 경우에만 myProfile query로 보완한다.
  const storeUserId = useUserId()
  const shouldFetchMyProfile = Boolean(accessToken) && storeUserId <= 0
  const myProfileQuery = useMyProfileQuery(accessToken, { enabled: shouldFetchMyProfile })
  const myUserId = storeUserId > 0 ? storeUserId : myProfileQuery.data?.id
  const hasMyUserId = typeof myUserId === 'number' && myUserId > 0

  // 방 기본 상세 조회는 매칭 페이지 진입 시 항상 먼저 수행한다.
  const roomDetailsQuery = usePvPRoomDetails(accessToken, roomId, {
    enabled: !isInvalidRoomId,
  })
  const roomDetailsFromServer = roomDetailsQuery.data

  // 서버 방 상세가 있으면 "내가 이미 host/guest인가?"를 먼저 판단한다.
  const isHostUser = hasMyUserId && roomDetailsFromServer?.host.id === myUserId
  const isGuestUser = hasMyUserId && roomDetailsFromServer?.guest?.id === myUserId

  // join은 "로그인한 사용자 + 내 id 확보 + 방 상세 확보"까지 끝났을 때만 판단 가능하다.
  const canEvaluateJoinRequirement =
    Boolean(accessToken) && hasMyUserId && Boolean(roomDetailsFromServer)
  // 빈 OPEN 방이고, 아직 내가 참가자가 아닐 때만 join을 시도한다.
  const shouldAttemptJoinRoom =
    canEvaluateJoinRequirement &&
    !isHostUser &&
    !isGuestUser &&
    roomDetailsFromServer?.status === OPEN_ROOM_STATUS &&
    roomDetailsFromServer.guest === null

  // guest로 진입하는 경우에만 join API를 호출한다.
  const roomJoinQuery = usePvPRoomJoinQuery(accessToken, roomId, {
    enabled: shouldAttemptJoinRoom,
  })

  // join 성공 시에는 join 응답을 최종 방 정보로 우선 사용한다.
  const joinedRoomDetails = roomJoinQuery.data?.ok ? roomJoinQuery.data.data : null
  // join 응답이 없으면 최초 방 상세를 그대로 사용한다.
  const resolvedRoomDetails = joinedRoomDetails ?? roomDetailsFromServer ?? null
  // 페이지 전반에서 쓸 room id는 최종 방 정보에서 다시 읽는다.
  const joinedRoomId = resolvedRoomDetails?.room.id ?? null
  // participant 판별 전에 한 번 더 지역 변수로 좁혀 타입 에러를 막는다.
  const roomDetails = resolvedRoomDetails

  // 최종 방 정보 기준으로 현재 유저가 실제 참가자인지 다시 판정한다.
  const isParticipantUser =
    !hasMyUserId || !roomDetails
      ? false
      : roomDetails.host.id === myUserId || roomDetails.guest?.id === myUserId
  // exit API는 실제 참가자인 경우에만 허용해야 하므로 participant 전용 room id를 만든다.
  const participantRoomId = isParticipantUser ? joinedRoomId : null

  // query 3종의 로딩 상태를 합쳐 페이지는 loading 한 가지만 보면 된다.
  const isProfileLoading = shouldFetchMyProfile && myProfileQuery.isLoading
  const isRoomLoading = roomDetailsQuery.isLoading
  const isJoinLoading = shouldAttemptJoinRoom && roomJoinQuery.isLoading
  const isLoading = isProfileLoading || isRoomLoading || isJoinLoading

  // 기본 방 상세를 못 받으면 fetch_error로 본다.
  const hasFetchError = roomDetailsQuery.isError || !roomDetailsFromServer
  // join을 시도했는데 실패했으면 join_error다.
  const hasJoinFailure =
    shouldAttemptJoinRoom && (roomJoinQuery.isError || roomJoinQuery.data?.ok === false)
  // 최종 방 정보가 없거나 참가자가 아니면 access_denied다.
  const hasRoomAccessDenied = !resolvedRoomDetails || !isParticipantUser

  // 페이지 분기는 accessState 하나만 보면 되도록 상태를 정규화한다.
  let accessState: PvPMatchingAccessState = 'ready'
  if (isInvalidRoomId) {
    accessState = 'invalid_room_id'
  } else if (isLoading) {
    accessState = 'loading'
  } else if (hasFetchError) {
    accessState = 'fetch_error'
  } else if (hasJoinFailure) {
    accessState = 'join_error'
  } else if (hasRoomAccessDenied) {
    accessState = 'access_denied'
  }

  // join/access 실패는 메시지를 보여준 뒤 방 목록으로 복귀시키는 대상이다.
  const shouldRedirectToRooms = accessState === 'join_error' || accessState === 'access_denied'

  return {
    accessState,
    myUserId,
    resolvedRoomDetails,
    joinedRoomId,
    participantRoomId,
    shouldRedirectToRooms,
  }
}

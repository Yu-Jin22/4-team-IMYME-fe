'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  CANCELED_ROOM_STATUS,
  EXPIRED_ROOM_STATUS,
  FINISHED_ROOM_STATUS,
  PVP_FEEDBACK_PATH_PREFIX,
  PVP_MAIN_PATH,
  PVP_MATCHING_ERROR_REDIRECT_DELAY_MS,
  PVP_ROOMS_PATH,
} from './pvpMatchingConstants'

type UsePvPMatchingRoutingParams = {
  latestRoomStatus: string | null
  participantRoomId: number | null
  roomId: number
  shouldRedirectToRooms: boolean
  cleanupMatchingConnection: () => Promise<void> | void
}

export function usePvPMatchingRouting({
  latestRoomStatus,
  participantRoomId,
  roomId,
  shouldRedirectToRooms,
  cleanupMatchingConnection,
}: UsePvPMatchingRoutingParams) {
  const router = useRouter()
  // 종료 상태 라우팅은 한 번만 실행되도록 막는다.
  const hasHandledTerminalRouteRef = useRef(false)

  // FINISHED는 feedback 페이지로, CANCELED/EXPIRED는 main으로 보낸다.
  const feedbackTargetRoomId = participantRoomId ?? roomId

  let nextRoutePath: string | null = null
  if (latestRoomStatus === CANCELED_ROOM_STATUS || latestRoomStatus === EXPIRED_ROOM_STATUS) {
    nextRoutePath = PVP_MAIN_PATH
  } else if (latestRoomStatus === FINISHED_ROOM_STATUS && !Number.isNaN(feedbackTargetRoomId)) {
    nextRoutePath = `${PVP_FEEDBACK_PATH_PREFIX}/${feedbackTargetRoomId}`
  }

  // 종료 상태 브로드캐스트를 받으면 소켓을 정리한 뒤 다음 페이지로 이동한다.
  useEffect(() => {
    if (!nextRoutePath) return
    if (hasHandledTerminalRouteRef.current) return

    hasHandledTerminalRouteRef.current = true

    const moveToNextRoute = async () => {
      await cleanupMatchingConnection()
      router.replace(nextRoutePath)
    }

    void moveToNextRoute()
  }, [cleanupMatchingConnection, nextRoutePath, router])

  // join/access 실패는 잠시 메시지를 보여준 뒤 방 목록으로 복귀시킨다.
  useEffect(() => {
    if (!shouldRedirectToRooms) return

    const timeoutId = window.setTimeout(() => {
      router.replace(PVP_ROOMS_PATH)
    }, PVP_MATCHING_ERROR_REDIRECT_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [router, shouldRedirectToRooms])
}

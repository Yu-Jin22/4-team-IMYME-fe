'use client'

import { useEffect } from 'react'

import { subscribeForegroundMessage } from '@/shared'

// 환경변수로 FCM 기능 전체 on/off 제어
const ENABLE_FCM = process.env.NEXT_PUBLIC_ENABLE_FCM === 'true'

export function FirebaseMessagingBootstrap() {
  useEffect(() => {
    // FCM 비활성 환경에서는 초기화하지 않음
    if (!ENABLE_FCM) return

    // foreground 구독 해제 함수를 effect cleanup에서 사용
    let unsubscribe = () => {}

    // 앱 시작 시 1회 실행되는 FCM foreground 구독 초기화 루틴
    // 토큰 발급/디바이스 등록은 로그인 콜백(KakaoCallbackPage)에서 수행한다.
    const initializeFirebaseMessaging = async () => {
      // 앱 foreground 상태 메시지 구독
      unsubscribe = await subscribeForegroundMessage(() => {
        // TODO: foreground 알림 UI 정책(toast/system notification)을 연결합니다.
      })
    }

    // 비동기 초기화 실행
    void initializeFirebaseMessaging()

    // 언마운트 시 foreground 수신 구독 해제
    return () => {
      unsubscribe()
    }
  }, [])

  return null
}

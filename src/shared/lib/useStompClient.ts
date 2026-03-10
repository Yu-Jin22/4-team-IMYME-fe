'use client'

// STOMP 프로토콜 클라이언트와 메시지/프레임 타입
import { Client, type Frame, type IMessage, type StompSubscription } from '@stomp/stompjs'
// React 훅 (연결 수명주기/상태 관리에 사용)
import { useCallback, useEffect, useRef, useState } from 'react'
// SockJS transport (http/https 엔드포인트로 연결)
import SockJS from 'sockjs-client'

// 훅 입력 옵션
type UseStompClientOptions = {
  accessToken: string | null
  path?: string
  // mount 시 자동 연결 여부
  autoConnect?: boolean
  // STOMP 내장 재연결 딜레이(ms)
  reconnectDelayMs?: number
  // 연결 성공 시 호출 (room 구독/세션 등록 훅 연결 포인트)
  onConnect?: (client: Client, frame: Frame) => void
  // STOMP disconnect frame 수신 시 호출
  onDisconnect?: (frame: Frame) => void
  // STOMP 레벨 에러 frame 수신 시 호출
  onStompError?: (frame: Frame) => void
  // 실제 웹소켓 close 이벤트 콜백
  onWebSocketClose?: (event: CloseEvent) => void
}

// 훅 반환값
type UseStompClientResult = {
  // STOMP 연결 여부 (UI 상태 표시용)
  isConnected: boolean
  // 실제 연결에 사용한 SockJS URL (디버깅용)
  url: string | null
  // 수동 연결 트리거 (autoConnect=false일 때 사용)
  connect: () => void
  // 수동 연결 해제
  disconnect: () => Promise<void>
  // destination 구독 helper (연결 안 되어 있으면 null)
  subscribe: (
    destination: string,
    callback: (message: IMessage) => void,
    headers?: Record<string, string>,
  ) => StompSubscription | null
  // destination publish helper (연결 안 되어 있으면 false)
  publish: (destination: string, body: string, headers?: Record<string, string>) => boolean
}

// 프로젝트에서 공통으로 사용하는 SockJS endpoint 기본 경로
const DEFAULT_WS_PATH = '/ws'
// STOMP client의 자동 재연결 간격 기본값 (5초)
const DEFAULT_RECONNECT_DELAY_MS = 5_000

export const buildSockJsUrl = (accessToken: string, path = DEFAULT_WS_PATH) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  // path를 base URL 기준으로 합쳐 절대 URL을 만든다.
  const url = new URL(path, baseUrl)

  // SockJS는 http/https 엔드포인트를 사용
  if (url.protocol === 'ws:') url.protocol = 'http:'
  if (url.protocol === 'wss:') url.protocol = 'https:'

  url.searchParams.set('token', accessToken)
  // 최종적으로 SockJS 생성자에 넘길 문자열 URL 반환
  return url.toString()
}

export function useStompClient(options: UseStompClientOptions): UseStompClientResult {
  const {
    accessToken,
    path = DEFAULT_WS_PATH,
    autoConnect = true,
    reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS,
    onConnect,
    onDisconnect,
    onStompError,
    onWebSocketClose,
  } = options

  // 실제 STOMP client 인스턴스는 ref로 보관 (렌더와 무관)
  const clientRef = useRef<Client | null>(null)
  // 콜백 최신값을 ref에 저장해 STOMP 이벤트 핸들러가 stale closure를 잡지 않게 한다.
  const callbacksRef = useRef({
    onConnect,
    onDisconnect,
    onStompError,
    onWebSocketClose,
  })
  // UI에서 연결 상태를 반응형으로 쓰기 위한 state
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // 부모 컴포넌트가 넘긴 콜백이 바뀌면 최신 콜백으로 교체한다.
    callbacksRef.current = {
      onConnect,
      onDisconnect,
      onStompError,
      onWebSocketClose,
    }
  }, [onConnect, onDisconnect, onStompError, onWebSocketClose])

  const url = accessToken ? buildSockJsUrl(accessToken, path) : null

  const connect = useCallback(() => {
    if (!url) return

    const currentClient = clientRef.current
    // 이미 active 상태면 중복 activate 방지
    if (currentClient?.active) return

    // STOMP Client 생성 (transport는 SockJS)
    const stompClient = new Client({
      // 연결이 실제로 시작될 때마다 새 SockJS를 만들어 재연결 시에도 안전하게 동작시킨다.
      webSocketFactory: () => new SockJS(url),
      // STOMP client 내부의 자동 재연결 간격(ms)
      reconnectDelay: reconnectDelayMs,
      onConnect: (frame) => {
        setIsConnected(true)
        callbacksRef.current.onConnect?.(stompClient, frame)
      },
      onDisconnect: (frame) => {
        // STOMP disconnect frame 수신 시 연결 상태를 false로 둔다.
        setIsConnected(false)
        callbacksRef.current.onDisconnect?.(frame)
      },
      onStompError: (frame) => {
        // STOMP application error frame 전달
        callbacksRef.current.onStompError?.(frame)
      },
      onWebSocketClose: (event) => {
        // transport close는 연결 종료로 간주
        setIsConnected(false)
        callbacksRef.current.onWebSocketClose?.(event)
      },
    })

    // ref에 보관한 뒤 activate로 실제 연결 시작
    clientRef.current = stompClient
    stompClient.activate()
  }, [reconnectDelayMs, url])

  const disconnect = useCallback(async () => {
    const client = clientRef.current
    if (!client) return

    // 새 연결 시도 전에 ref를 비워 중복 참조를 막는다.
    clientRef.current = null
    setIsConnected(false)
    // deactivate는 비동기 종료(STOMP + transport close)
    await client.deactivate()
  }, [])

  const subscribe: UseStompClientResult['subscribe'] = (destination, callback, headers) => {
    const client = clientRef.current
    // 연결 전 구독 요청은 실패(null)로 반환
    if (!client || !client.connected) return null
    // destination 예: /sub/rooms/{roomId}
    return client.subscribe(destination, callback, headers)
  }

  const publish: UseStompClientResult['publish'] = (destination, body, headers) => {
    const client = clientRef.current
    // 연결 전 발행 요청은 실패(false)로 반환
    if (!client || !client.connected) return false

    // destination 예: /pub/rooms/{roomId}/session
    client.publish({
      // 서버에서 라우팅할 STOMP destination
      destination,
      // 메시지 payload (보통 JSON.stringify 결과)
      body,
      // 인증/커스텀 헤더가 필요하면 호출부에서 주입
      headers,
    })
    // publish 성공 여부를 boolean으로 돌려 호출부 분기 쉽게 한다.
    return true
  }

  useEffect(() => {
    if (!autoConnect || !accessToken) return

    // mount/토큰변경 시 자동 연결
    connect()

    return () => {
      // unmount/옵션변경 시 기존 연결 정리
      void disconnect()
    }
    // accessToken/path가 바뀌면 새 client를 만들기 위해 재연결한다.
  }, [accessToken, autoConnect, connect, disconnect])

  return {
    isConnected,
    url,
    connect,
    disconnect,
    subscribe,
    publish,
  }
}

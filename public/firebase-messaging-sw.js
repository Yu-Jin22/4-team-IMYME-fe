// 이 파일은 브라우저 메인 스레드가 아니라 Service Worker 스레드에서 실행됨.
// FCM 백그라운드 메시지 수신/알림 표시를 담당.

// Firebase compat SDK(app)을 Service Worker 환경에 로드
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
// Firebase compat SDK(messaging)을 Service Worker 환경에 로드
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

// 프로젝트 Firebase 설정값입니다.
// TODO: 실제 프로젝트 값으로 교체하세요.
const FIREBASE_CONFIG = {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  apiKey: 'AIzaSyAo85zYqzZQZgKBfXhLQA5zcWVKWz_7erA',
  authDomain: 'mine-83083.firebaseapp.com',
  projectId: 'mine-83083',
  storageBucket: 'mine-83083.firebasestorage.app',
  messagingSenderId: '898897433779',
  appId: '1:898897433779:web:2bb242938e14b2dab30cc6',
  measurementId: 'G-5SKGYVSCLL',
}

// 설정값이 placeholder 상태인지 검사하는 유틸입니다.
const isPlaceholderValue = (value) => typeof value === 'string' && value.startsWith('__')

// Firebase 설정이 모두 준비되었는지 확인합니다.
const hasValidFirebaseConfig =
  FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.messagingSenderId &&
  FIREBASE_CONFIG.projectId &&
  !isPlaceholderValue(FIREBASE_CONFIG.apiKey) &&
  !isPlaceholderValue(FIREBASE_CONFIG.messagingSenderId) &&
  !isPlaceholderValue(FIREBASE_CONFIG.projectId)

// install 시점에 새로운 SW를 즉시 활성 후보로 올립니다.
self.addEventListener('install', (event) => {
  // skipWaiting으로 대기 상태를 건너뜁니다.
  event.waitUntil(self.skipWaiting())
})

// activate 시점에 현재 탭 클라이언트를 즉시 제어합니다.
self.addEventListener('activate', (event) => {
  // clients.claim으로 새 SW가 즉시 제어권을 가져옵니다.
  event.waitUntil(self.clients.claim())
})

// Firebase 설정이 유효할 때만 Messaging을 초기화합니다.
if (hasValidFirebaseConfig) {
  // 동일 SW 컨텍스트에서 앱을 중복 초기화하지 않도록 검사합니다.
  if (!firebase.apps.length) {
    // Firebase 앱을 초기화합니다.
    firebase.initializeApp(FIREBASE_CONFIG)
  }

  // Messaging 인스턴스를 생성합니다.
  const messaging = firebase.messaging()

  // 앱이 백그라운드일 때 수신한 FCM 메시지를 처리합니다.
  messaging.onBackgroundMessage((payload) => {
    // payload.notification이 없을 수도 있으므로 안전하게 접근합니다.
    const notification = payload?.notification ?? {}
    // 알림 제목이 없으면 기본 제목을 사용합니다.
    const title = notification.title || 'MINE'
    // 알림 본문이 없으면 빈 문자열로 처리합니다.
    const body = notification.body || ''
    // 아이콘이 없으면 프로젝트 기본 아이콘을 사용합니다.
    const icon = notification.icon || '/logo.png'

    // data 필드에 라우팅 정보(click_action/link 등)를 보존합니다.
    const data = payload?.data ?? {}

    // Service Worker 등록 객체를 통해 시스템 알림을 표시합니다.
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/logo.png',
      data,
    })
  })
}

// 사용자가 알림을 클릭했을 때 앱 이동/포커싱을 처리합니다.
self.addEventListener('notificationclick', (event) => {
  // 클릭된 알림을 닫습니다.
  event.notification.close()

  // 알림 data에서 이동 URL을 읽습니다.
  const notificationData = event.notification.data || {}
  // click_action 또는 link가 있으면 우선 사용하고, 없으면 메인으로 이동합니다.
  const targetPath = notificationData.click_action || notificationData.link || '/main'
  // 절대 URL 변환(상대 경로 지원)을 위해 현재 origin 기준 URL을 만듭니다.
  const targetUrl = new URL(targetPath, self.location.origin).toString()

  // 기존 탭 재사용(focus) 또는 새 탭 열기를 비동기로 보장합니다.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭 중 targetUrl과 동일한 탭이 있으면 포커싱합니다.
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }

      // 동일 탭이 없으면 새 창을 엽니다.
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      // openWindow를 사용할 수 없는 환경에서는 아무 작업도 하지 않습니다.
      return undefined
    }),
  )
})

// 이 파일은 브라우저 메인 스레드가 아니라 Service Worker 스레드에서 실행됨.
// FCM 백그라운드 메시지 수신/알림 표시를 담당.

const CACHE_VERSION = 'v1'
const NAVIGATION_CACHE_NAME = `mine-navigation-${CACHE_VERSION}`
const STATIC_ASSET_CACHE_NAME = `mine-static-${CACHE_VERSION}`
const OFFLINE_FALLBACK_PATH = '/offline'
const CACHEABLE_REQUEST_METHOD = 'GET'
const STATIC_ASSET_PATHS = ['/logo.png', '/manifest.webmanifest']
const CACHEABLE_NAVIGATION_PATHS = new Set(['/login', '/offline'])
const HTTP_STATUS_OK_MIN = 200
const HTTP_STATUS_REDIRECT_MAX = 399

const readEnvironmentVariable = (key) => {
  if (typeof process === 'undefined' || !process?.env) {
    return undefined
  }

  const value = process.env[key]
  return typeof value === 'string' ? value : undefined
}

// 프로젝트 Firebase 설정값입니다.
// TODO: 실제 프로젝트 값으로 교체하세요.
const FIREBASE_CONFIG = {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  apiKey: readEnvironmentVariable('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnvironmentVariable('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnvironmentVariable('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnvironmentVariable('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnvironmentVariable('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnvironmentVariable('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: readEnvironmentVariable('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
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

const isSuccessfulResponse = (response) =>
  response.status >= HTTP_STATUS_OK_MIN && response.status <= HTTP_STATUS_REDIRECT_MAX

const isCacheableStaticAsset = (requestUrl) =>
  requestUrl.pathname.startsWith('/_next/static/') ||
  STATIC_ASSET_PATHS.includes(requestUrl.pathname)

const isCacheableNavigationPath = (requestUrl) =>
  CACHEABLE_NAVIGATION_PATHS.has(requestUrl.pathname)

const cacheOfflineShell = async () => {
  const navigationCache = await caches.open(NAVIGATION_CACHE_NAME)
  const staticAssetCache = await caches.open(STATIC_ASSET_CACHE_NAME)

  await Promise.allSettled([
    navigationCache.add(OFFLINE_FALLBACK_PATH),
    staticAssetCache.addAll(STATIC_ASSET_PATHS),
  ])
}

const cleanupOldCaches = async () => {
  const currentCacheNames = new Set([NAVIGATION_CACHE_NAME, STATIC_ASSET_CACHE_NAME])
  const cacheNames = await caches.keys()

  await Promise.all(
    cacheNames
      .filter((cacheName) => !currentCacheNames.has(cacheName))
      .map((cacheName) => caches.delete(cacheName)),
  )
}

const handleNavigationRequest = async (request) => {
  const navigationCache = await caches.open(NAVIGATION_CACHE_NAME)

  try {
    const networkResponse = await fetch(request)
    const requestUrl = new URL(request.url)

    if (isSuccessfulResponse(networkResponse) && isCacheableNavigationPath(requestUrl)) {
      await navigationCache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch {
    const cachedPage = await navigationCache.match(request)
    if (cachedPage) {
      return cachedPage
    }

    const offlineFallbackPage = await navigationCache.match(OFFLINE_FALLBACK_PATH)
    if (offlineFallbackPage) {
      return offlineFallbackPage
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }
}

const handleStaticAssetRequest = async (request) => {
  const staticAssetCache = await caches.open(STATIC_ASSET_CACHE_NAME)
  const cachedResponse = await staticAssetCache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (isSuccessfulResponse(networkResponse)) {
      await staticAssetCache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch {
    return new Response(null, {
      status: 504,
      statusText: 'Gateway Timeout',
    })
  }
}

// install 시점에 새로운 SW를 즉시 활성 후보로 올립니다.
self.addEventListener('install', (event) => {
  // 오프라인 진입용 페이지/정적 리소스를 선캐싱한 뒤 즉시 활성 후보로 올립니다.
  event.waitUntil(
    (async () => {
      await cacheOfflineShell()
      await self.skipWaiting()
    })(),
  )
})

// activate 시점에 현재 탭 클라이언트를 즉시 제어합니다.
self.addEventListener('activate', (event) => {
  // 이전 버전 캐시를 정리하고, clients.claim으로 새 SW가 즉시 제어권을 가져옵니다.
  event.waitUntil(
    (async () => {
      await cleanupOldCaches()
      await self.clients.claim()
    })(),
  )
})

// Firebase 설정이 유효할 때만 Messaging을 초기화합니다.
if (hasValidFirebaseConfig) {
  try {
    // Firebase compat SDK(app)을 Service Worker 환경에 로드
    importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
    // Firebase compat SDK(messaging)을 Service Worker 환경에 로드
    importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

    // 동일 SW 컨텍스트에서 앱을 중복 초기화하지 않도록 검사합니다.
    if (!firebase.apps.length) {
      // Firebase 앱을 초기화합니다.
      firebase.initializeApp(FIREBASE_CONFIG)
    }

    // Messaging 인스턴스를 생성합니다.
    const messaging = firebase.messaging()

    // 앱이 백그라운드일 때 수신한 FCM 메시지를 처리합니다.
    messaging.onBackgroundMessage((payload) => {
      // 서버에서 전달한 payload.data 스키마를 기준으로 수신합니다.
      const data = payload?.data ?? {}
      const title = data.title ?? 'MINE'
      const content = data.content ?? ''
      const path = data.path ?? '/main'

      // Service Worker 등록 객체를 통해 시스템 알림을 표시합니다.
      self.registration.showNotification(title, {
        body: content,
        icon: '/logo.png',
        badge: '/logo.png',
        data: {
          ...data,
          path,
        },
      })
    })
  } catch (error) {
    console.error('[sw] firebase messaging initialization failed', error)
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== CACHEABLE_REQUEST_METHOD) {
    return
  }

  const requestUrl = new URL(request.url)
  if (requestUrl.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  if (isCacheableStaticAsset(requestUrl)) {
    event.respondWith(handleStaticAssetRequest(request))
  }
})

// 사용자가 알림을 클릭했을 때 앱 이동/포커싱을 처리합니다.
self.addEventListener('notificationclick', (event) => {
  // 클릭된 알림을 닫습니다.
  event.notification.close()

  // 알림 data에서 이동 URL을 읽습니다.
  const notificationData = event.notification.data ?? {}
  const targetPath = notificationData.path ?? '/main'
  // 절대 URL 변환(상대 경로 지원)을 위해 현재 origin 기준 URL을 만듭니다.
  const targetUrl = new URL(targetPath, self.location.origin).toString()

  // 기존 탭 재사용(focus) 또는 새 탭 열기를 비동기로 보장
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭 중 targetUrl과 동일한 탭이 있으면 포커싱
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

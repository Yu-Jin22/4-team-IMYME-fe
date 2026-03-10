'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { FirebaseMessagingBootstrap } from './FirebaseMessagingBootstrap'

export function Provider({ children }: { children: React.ReactNode }) {
  // QueryClient는 앱 생명주기 동안 하나만 유지한다.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {/* 앱 전역에서 1회만 FCM 초기화를 수행 */}
      <FirebaseMessagingBootstrap />
      {children}
    </QueryClientProvider>
  )
}

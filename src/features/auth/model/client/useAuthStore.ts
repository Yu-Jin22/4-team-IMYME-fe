'use client'

import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export const useAuthStore = create(
  immer(
    combine({ accessToken: '', accessTokenExpiresAtMs: 0 }, (set) => ({
      actions: {
        setAccessToken: (token: string, expiresAtMs?: number) => {
          set((state) => {
            state.accessToken = token
            // 서버 응답 expiresIn은 실제로 "토큰 만료 시점(ms epoch)"이므로 그대로 저장한다.
            state.accessTokenExpiresAtMs = expiresAtMs ?? 0
          })
        },
        clearAccessToken: () => {
          set((state) => {
            state.accessToken = ''
            state.accessTokenExpiresAtMs = 0
          })
        },
      },
    })),
  ),
)

export const useAccessToken = () => {
  const accessToken = useAuthStore((store) => store.accessToken)
  return accessToken
}

export const useSetAccessToken = () => {
  const setAccessToken = useAuthStore((store) => store.actions.setAccessToken)
  return setAccessToken
}

export const useAccessTokenExpiresAtMs = () => {
  // AuthBootstrap이 선제 갱신 타이머를 계산할 때 사용한다.
  const accessTokenExpiresAtMs = useAuthStore((store) => store.accessTokenExpiresAtMs)
  return accessTokenExpiresAtMs
}

export const useClearAccesstoken = () => {
  const clearAccessToken = useAuthStore((store) => store.actions.clearAccessToken)
  return clearAccessToken
}

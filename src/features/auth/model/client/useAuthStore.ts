'use client'

import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export const useAuthStore = create(
  immer(
    combine({ accessToken: '', accessTokenExpiresAtMs: 0 }, (set) => ({
      actions: {
        setAccessToken: (token: string, expiresInMs?: number) => {
          set((state) => {
            state.accessToken = token
            // expiresIn은 "남은 시간(ms)"이므로, 스케줄링에 쓰기 쉽게 절대 시각(ms)으로 변환해 저장한다.
            state.accessTokenExpiresAtMs = expiresInMs ? Date.now() + expiresInMs : 0
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

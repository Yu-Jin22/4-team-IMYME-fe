'use client'

import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export const useAuthStore = create(
  immer(
    combine({ accessToken: '' }, (set) => ({
      actions: {
        setAccessToken: (token: string) => {
          set((state) => {
            state.accessToken = token
          })
        },
        clearAccessToken: () => {
          set((state) => {
            state.accessToken = ''
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

export const useClearAccesstoken = () => {
  const clearAccessToken = useAuthStore((store) => store.actions.clearAccessToken)
  return clearAccessToken
}

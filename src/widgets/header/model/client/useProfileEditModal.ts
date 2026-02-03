'use client'

import { useState } from 'react'

export function useProfileEditModal() {
  const [profileEditOpen, setProfileEditOpen] = useState(false)

  const handleProfileEditOpenChange = (nextOpen: boolean) => {
    setProfileEditOpen(nextOpen)
  }

  const handleProfileEditOpen = () => {
    setProfileEditOpen(true)
  }

  return {
    profileEditOpen,
    handleProfileEditOpenChange,
    handleProfileEditOpen,
  }
}

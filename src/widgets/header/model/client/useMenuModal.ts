'use client'

import { useState } from 'react'

export function useMenuModal() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleMenuOpenChange = (nextOpen: boolean) => {
    setMenuOpen(nextOpen)
  }

  return {
    menuOpen,
    handleMenuOpenChange,
  }
}

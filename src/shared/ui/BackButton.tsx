'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type BackButtonProps = {
  onClick?: () => void
  disabled?: boolean
}

export function BackButton({ onClick, disabled = false }: BackButtonProps) {
  const router = useRouter()
  const handleClick = () => {
    if (disabled) return

    if (onClick) {
      onClick()
      return
    }

    router.back()
  }

  return (
    <button
      type="button"
      className="bg-secondary ml-4 flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
      onClick={handleClick}
      disabled={disabled}
    >
      <ChevronLeft
        size={30}
        className="text-primary"
      />
    </button>
  )
}

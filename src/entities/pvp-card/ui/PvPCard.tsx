'use client'

import { ArrowRight, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { hidePvPCard } from '../api/hidePvPCard'

type PvPResultVariant = 'win' | 'lose'

type PvPCardProps = {
  id?: number
  historyId?: number
  accessToken?: string
  title: string
  resultVariant: PvPResultVariant
  opponentName: string
  categoryName: string
  keywordName: string
  onClick?: () => void
  onDelete?: () => void | Promise<void>
}

const REVEAL_PX = 50
const DRAG_THRESHOLD_PX = 6
const PVP_CARD_TAG_MAX_LENGTH = 6

const WRAPPER_CLASSNAME = 'relative w-80 self-center overflow-visible'
const BACK_CLASSNAME = 'absolute right-0 top-0 bottom-0 flex items-center justify-center'
const CARD_CLASSNAME =
  'border-secondary bg-background flex h-20 max-h-20 w-80 flex-col items-center justify-center gap-2 rounded-xl border'
const ROW_CLASSNAME = 'flex w-full items-center px-4'
const RESULT_CLASSNAME =
  'ml-auto flex h-5 min-w-16 items-center justify-center rounded-2xl px-2 text-sm'
const CATEGORY_CLASSNAME =
  'bg-secondary text-primary ml-auto flex h-5 min-w-15 items-center justify-center rounded-2xl px-2 text-xs'
const KEYWORD_CLASSNAME =
  'bg-secondary text-primary ml-2 flex h-5 min-w-15 items-center justify-center rounded-2xl px-2 text-xs'
const ARROW_SIZE = 20
const WIN_RESULT_TONE_CLASSNAME = 'bg-secondary text-primary'
const LOSE_RESULT_TONE_CLASSNAME = 'bg-red-100 text-red-600'

const RESULT_LABEL_BY_VARIANT: Record<PvPResultVariant, string> = {
  win: 'Win',
  lose: 'Lose',
}

const shortenTagLabel = (value: string) => {
  if (value.length <= PVP_CARD_TAG_MAX_LENGTH) return value
  return `${value.slice(0, PVP_CARD_TAG_MAX_LENGTH)}...`
}

export function PvPCard({
  historyId,
  accessToken,
  title,
  resultVariant,
  opponentName,
  categoryName,
  keywordName,
  onClick,
  onDelete,
}: PvPCardProps) {
  const resultLabel = RESULT_LABEL_BY_VARIANT[resultVariant]
  const resultToneClassName =
    resultVariant === 'lose' ? LOSE_RESULT_TONE_CLASSNAME : WIN_RESULT_TONE_CLASSNAME
  const shortenedCategoryName = shortenTagLabel(categoryName)
  const shortenedKeywordName = shortenTagLabel(keywordName)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const startXRef = useRef(0)
  const baseXRef = useRef(0)

  const didDragRef = useRef(false)
  const suppressClickRef = useRef(false)

  const isRevealed = x !== 0

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
  const close = () => setX(0)

  const handleDeleteClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (!accessToken || !historyId || isDeleting) return

    setIsDeleting(true)

    const hideResult = await hidePvPCard(accessToken, historyId)

    setIsDeleting(false)

    if (!hideResult) return

    close()

    if (onDelete) {
      await onDelete()
    }
  }

  useEffect(() => {
    if (!isRevealed) return

    const onPointerDown = (e: PointerEvent) => {
      const el = wrapperRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) close()
    }

    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    return () => window.removeEventListener('pointerdown', onPointerDown, { capture: true })
  }, [isRevealed])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true)
    startXRef.current = e.clientX
    baseXRef.current = x

    didDragRef.current = false
    suppressClickRef.current = false

    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return

    const dx = e.clientX - startXRef.current
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
      didDragRef.current = true
    }

    const next = clamp(baseXRef.current + dx, -REVEAL_PX, 0)
    setX(next)
  }

  const handlePointerUp = () => {
    setDragging(false)

    if (didDragRef.current) {
      suppressClickRef.current = true
    }

    const shouldOpen = x < -REVEAL_PX / 2
    setX(shouldOpen ? -REVEAL_PX : 0)
  }

  const handleCardClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (isRevealed) close()

    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={WRAPPER_CLASSNAME}
    >
      <div
        className={[
          BACK_CLASSNAME,
          isRevealed ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          'transition-opacity duration-150',
        ].join(' ')}
        style={{ width: REVEAL_PX }}
      >
        <button
          type="button"
          aria-label="카드 삭제"
          className="flex h-8 w-8 items-center justify-center"
          disabled={isDeleting}
          onClick={(event) => {
            void handleDeleteClick(event)
          }}
        >
          <Trash2 className="text-black" />
        </button>
      </div>

      <div
        className={[
          CARD_CLASSNAME,
          'relative z-10 touch-pan-y',
          dragging ? '' : 'transition-transform duration-200 ease-out',
          onClick ? 'cursor-pointer' : '',
        ].join(' ')}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardClick}
      >
        <div className={ROW_CLASSNAME}>
          <p className="font-semibold">{title}</p>
          <div className={`${RESULT_CLASSNAME} ${resultToneClassName}`}>{resultLabel}</div>
        </div>
        <div className={ROW_CLASSNAME}>
          <p className="text-sm">VS. {opponentName}</p>
          <div className={CATEGORY_CLASSNAME}>{shortenedCategoryName}</div>
          <div className={KEYWORD_CLASSNAME}>{shortenedKeywordName}</div>
          <ArrowRight
            className="ml-2"
            size={ARROW_SIZE}
          />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useParams, useRouter } from 'next/navigation'

import { PvPCategory, PvPKeyword, usePvPCardDetails } from '@/entities/pvp-card'
import { useAccessToken } from '@/features/auth'
import { PvPParticipants, PvPProfile } from '@/features/pvp'
import { PvPFeedbackPanel, PvPWinnerProfileCard } from '@/features/pvp-feedback'
import { ModeHeader, StatusMessage } from '@/shared'

const FALLBACK_TITLE = '대결 상세'
const WRAPPER_CLASSNAME = 'flex h-full w-full flex-1 flex-col gap-4'
const DEFAULT_INVALID_ROOM_ID_MESSAGE = '잘못된 방 정보입니다.'
const DEFAULT_LOADING_MESSAGE = '대결 기록을 불러오는 중입니다.'
const DEFAULT_ERROR_MESSAGE = '대결 기록을 불러오지 못했습니다.'
const DEFAULT_EMPTY_MESSAGE = '표시할 대결 기록이 없습니다.'
const MAIN_PAGE_PATH = '/main'

type PvPFeedbackViewVariant = 'details' | 'matching'

type PvPFeedbackViewMessages = {
  invalidRoomId?: string
  loading?: string
  error?: string
  empty?: string
}

type PvPFeedbackViewProps = {
  variant: PvPFeedbackViewVariant
  roomId?: number
  messages?: PvPFeedbackViewMessages
}

export function PvPFeedbackView({ variant, roomId, messages }: PvPFeedbackViewProps) {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const routeRoomId = Number(params.id)
  const targetRoomId = typeof roomId === 'number' ? roomId : routeRoomId

  const accessToken = useAccessToken()
  const isInvalidRoomId = Number.isNaN(targetRoomId)
  const detailsQuery = usePvPCardDetails(accessToken, isInvalidRoomId ? undefined : targetRoomId)

  if (isInvalidRoomId) {
    return <StatusMessage message={messages?.invalidRoomId ?? DEFAULT_INVALID_ROOM_ID_MESSAGE} />
  }

  if (detailsQuery.isLoading) {
    return <StatusMessage message={messages?.loading ?? DEFAULT_LOADING_MESSAGE} />
  }

  if (detailsQuery.isError) {
    return <StatusMessage message={messages?.error ?? DEFAULT_ERROR_MESSAGE} />
  }

  const details = detailsQuery.data
  if (!details) {
    return <StatusMessage message={messages?.empty ?? DEFAULT_EMPTY_MESSAGE} />
  }

  const handleBackClick = () => {
    if (variant === 'matching') {
      router.replace(MAIN_PAGE_PATH)
      return
    }

    router.back()
  }

  return (
    <div className={WRAPPER_CLASSNAME}>
      <ModeHeader
        mode="pvp"
        step="feedback"
        title={details.room?.name ?? FALLBACK_TITLE}
        onBack={handleBackClick}
      />
      <PvPCategory categoryName={details.category?.name ?? ''} />
      <PvPParticipants
        leftProfile={{
          name: details.myResult?.user?.nickname ?? '',
          avatarUrl: details.myResult?.user?.profileImageUrl ?? '',
        }}
        rightProfile={{
          name: details.opponentResult?.user?.nickname ?? '',
          avatarUrl: details.opponentResult?.user?.profileImageUrl ?? '',
        }}
      />
      <PvPKeyword keywordName={details.keyword?.name ?? ''} />
      <PvPWinnerProfileCard
        profile={
          <PvPProfile
            name={details.winner?.nickname ?? ''}
            avatarUrl={details.winner?.profileImageUrl}
          />
        }
      />
      <PvPFeedbackPanel feedback={details.myResult?.feedback} />
    </div>
  )
}

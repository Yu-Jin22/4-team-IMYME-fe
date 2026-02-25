'use client'

import { useParams, useRouter } from 'next/navigation'

import { PvPCategory, PvPKeyword, usePvPCardDetails } from '@/entities/pvp-card'
import { useAccessToken } from '@/features/auth'
import { PvPParticipants, PvPProfile } from '@/features/pvp'
import { PvPFeedbackPanel, PvPWinnerProfileCard } from '@/features/pvp-feedback'
import { ModeHeader } from '@/shared'
export function PvPDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const roomIdParam = params.id?.toString()
  const roomId = roomIdParam ? Number(roomIdParam) : undefined

  const accessToken = useAccessToken()
  const pvpCardDetailsQuery = usePvPCardDetails(accessToken, roomId)

  if (pvpCardDetailsQuery.isLoading) {
    return <div>대결 기록을 불러오는 중입니다...</div>
  }

  if (pvpCardDetailsQuery.isError) {
    return <div>대결 기록을 불러오지 못했습니다.</div>
  }

  const pvpCardDetails = pvpCardDetailsQuery.data

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4">
      <ModeHeader
        mode="pvp"
        step="feedback"
        title={pvpCardDetails?.room?.name ?? '대결 상세'}
        onBack={() => router.back()}
      />
      <PvPCategory categoryName={pvpCardDetails?.category?.name ?? ''} />
      <PvPParticipants
        leftProfile={{
          name: pvpCardDetails?.myResult?.user?.nickname ?? '',
          avatarUrl: pvpCardDetails?.myResult?.user?.profileImageUrl ?? '',
        }}
        rightProfile={{
          name: pvpCardDetails?.opponentResult?.user?.nickname ?? '',
          avatarUrl: pvpCardDetails?.opponentResult?.user?.profileImageUrl ?? '',
        }}
      />
      <PvPKeyword keywordName={pvpCardDetails?.keyword?.name ?? ''} />
      <PvPWinnerProfileCard
        profile={
          <PvPProfile
            name={pvpCardDetails?.winner?.nickname ?? ''}
            avatarUrl={pvpCardDetails?.winner.profileImageUrl}
          />
        }
      />
      <PvPFeedbackPanel feedback={pvpCardDetails?.myResult?.feedback} />
    </div>
  )
}

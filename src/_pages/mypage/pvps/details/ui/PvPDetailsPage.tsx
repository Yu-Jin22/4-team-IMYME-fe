'use client'

import { useParams, useRouter } from 'next/navigation'

import { usePvPCardDetails } from '@/entities/pvp-card'
import { useAccessToken } from '@/features/auth'
import { PvPProfile } from '@/features/pvp'
import { ModeHeader, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared'

const TAB_CONTENT_CLASSNAME =
  'break-normal whitespace-pre-line min-h-[20vh] max-h-[40vh] w-full rounded-2xl bg-white p-3'
export function PvPDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const roomIdParam = params.id?.toString()
  const roomId = roomIdParam ? Number(roomIdParam) : undefined

  const accessToken = useAccessToken()
  const pvpCardDetailsQuery = usePvPCardDetails(accessToken, roomId)

  if (pvpCardDetailsQuery.isLoading) {
    return <div>대결 상세를 불러오는 중입니다...</div>
  }

  if (pvpCardDetailsQuery.isError) {
    return <div>대결 상세를 불러오지 못했습니다.</div>
  }

  const pvpCardDetails = pvpCardDetailsQuery.data

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <ModeHeader
        mode="pvp"
        step="feedback"
        title={pvpCardDetails?.room?.name ?? '대결 상세'}
        onBack={() => router.back()}
      />
      <div className="mt-5">
        <p className="mr-auto ml-10 text-sm">
          대결 카테고리 {pvpCardDetails?.category?.name ?? ''}
        </p>
      </div>
      <div className="flex w-full items-center justify-center gap-20">
        <PvPProfile
          name={pvpCardDetails?.myResult?.user?.nickname ?? ''}
          avatarUrl={pvpCardDetails?.myResult?.user?.profileImageUrl ?? ''}
        />
        <p>VS.</p>
        <PvPProfile
          name={pvpCardDetails?.opponentResult?.nickname ?? ''}
          avatarUrl={pvpCardDetails?.opponentResult?.profileImageUrl ?? ''}
        />
      </div>
      <div className="mt-5 flex w-full flex-col items-center justify-center gap-4">
        <p className="text-sm">대결 키워드</p>
        <div className="bg-secondary flex h-12 w-80 items-center justify-center rounded-2xl">
          <p>{pvpCardDetails?.keyword?.name ?? ''}</p>
        </div>
      </div>
      <div className="bg-secondary mt-5 flex w-80 flex-col items-center justify-center gap-2 self-center rounded-2xl px-5 py-5">
        <PvPProfile name={pvpCardDetails?.winner?.nickname ?? ''} />
        <p className="font-semibold">Win!</p>
      </div>
      <div className="w-full max-w-(--frame-max-width) self-center px-7 py-5">
        <Tabs defaultValue="summary">
          <TabsList
            variant="line"
            className="w-full text-2xl text-black"
          >
            <TabsTrigger value="summary">요약</TabsTrigger>
            <TabsTrigger value="keywords">키워드</TabsTrigger>
            <TabsTrigger value="facts">팩트</TabsTrigger>
            <TabsTrigger value="understanding">이해도</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <div className="max-h-[40vh] min-h-[20vh] w-full rounded-2xl bg-white p-3 break-normal whitespace-pre-line">
              {pvpCardDetails?.myResult.feedback.summary ?? ''}
            </div>
          </TabsContent>
          <TabsContent value="keywords">
            <div className={TAB_CONTENT_CLASSNAME}>
              {pvpCardDetails?.myResult.feedback.keywords ?? ''}
            </div>
          </TabsContent>
          <TabsContent value="facts">
            <div className={TAB_CONTENT_CLASSNAME}>
              {pvpCardDetails?.myResult.feedback.facts ?? ''}
            </div>
          </TabsContent>
          <TabsContent value="understanding">
            <div className={TAB_CONTENT_CLASSNAME}>
              {pvpCardDetails?.myResult.feedback.understanding ?? ''}
            </div>
          </TabsContent>
        </Tabs>
        <div className="w-full self-center pt-3">
          <p className="text-start text-sm font-semibold">비교 피드백</p>
          <div className="min-h-[10vh] w-full rounded-2xl bg-white p-3 text-sm break-normal whitespace-pre-line">
            {pvpCardDetails?.myResult.feedback.socraticFeedback ?? ''}
          </div>
        </div>
      </div>
    </div>
  )
}

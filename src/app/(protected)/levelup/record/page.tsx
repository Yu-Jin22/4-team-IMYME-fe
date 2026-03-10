import { cookies } from 'next/headers'
import { Suspense } from 'react'

import { LevelUpRecordPage } from '@/_pages/record'
import { ACCESS_TOKEN_COOKIE } from '@/features/auth/server'
import { getInitialCardDetails } from '@/features/levelup-feedback'

type LevelUpRecordSearchParams = {
  cardId?: string | string[]
}

type LevelUpRecordPageRouteProps = {
  searchParams: Promise<LevelUpRecordSearchParams> | LevelUpRecordSearchParams
}

function parseOptionalSearchNumber(value: string | string[] | undefined): number | undefined {
  if (!value) return undefined

  const rawValue = Array.isArray(value) ? value[0] : value
  const parsedValue = Number(rawValue)
  return Number.isNaN(parsedValue) ? undefined : parsedValue
}

export default async function Page({ searchParams }: LevelUpRecordPageRouteProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams)
  const cardId = parseOptionalSearchNumber(resolvedSearchParams.cardId)

  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? ''
  const initialCardDetails = await getInitialCardDetails(accessToken, cardId)

  return (
    <Suspense fallback={<div></div>}>
      <LevelUpRecordPage initialCardDetails={initialCardDetails} />
    </Suspense>
  )
}

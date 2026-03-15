import { cookies } from 'next/headers'

import { MainPage } from '@/_pages/main'
import { ACCESS_TOKEN_COOKIE } from '@/features/auth/server'
import { getInitialTodayChallenge } from '@/features/challenge/server'

const OPEN_CHALLENGE_STATUS = 'OPEN'

const getInitialChallengeOpenState = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? ''
  const todayChallenge = await getInitialTodayChallenge(accessToken)

  return todayChallenge?.status === OPEN_CHALLENGE_STATUS
}

export default async function Page() {
  const isChallengeOpen = await getInitialChallengeOpenState()

  return <MainPage isChallengeOpen={isChallengeOpen} />
}

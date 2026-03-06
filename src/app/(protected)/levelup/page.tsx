import { cookies } from 'next/headers'

import { LevelUpStartPage } from '@/_pages/levelup'
import { ACCESS_TOKEN_COOKIE } from '@/features/auth/server'
import { getInitialCategories } from '@/features/filtering/server'

const getLevelUpInitialCategories = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? ''

  return getInitialCategories(accessToken)
}

export default async function Page() {
  const initialCategories = await getLevelUpInitialCategories()

  return <LevelUpStartPage initialCategories={initialCategories} />
}

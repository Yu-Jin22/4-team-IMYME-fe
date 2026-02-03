import { Suspense } from 'react'

import { LevelUpRecordPage } from '@/_pages/record'

export default function Page() {
  return (
    <Suspense fallback={<div></div>}>
      <LevelUpRecordPage />
    </Suspense>
  )
}

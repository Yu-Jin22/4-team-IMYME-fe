import { ReactNode } from 'react'

import { ModeLayout } from '@/widgets/header'

type ChallengeLayoutProps = {
  children: ReactNode
}

export default function ChallengeLayout({ children }: ChallengeLayoutProps) {
  return <ModeLayout>{children}</ModeLayout>
}

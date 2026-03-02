import { ProfilePagesLayout } from '@/widgets/layouts'

import type { ReactNode } from 'react'

type ProfilePagesRouteLayoutProps = {
  children: ReactNode
}

export default function ProfilePagesRouteLayout({ children }: ProfilePagesRouteLayoutProps) {
  return <ProfilePagesLayout>{children}</ProfilePagesLayout>
}

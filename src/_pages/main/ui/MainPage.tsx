import { ModeButton } from '@/features/mode'
import { RecentCardList } from '@/features/recent-card/ui/RecentCardList'
import { RecentListHeader } from '@/shared'
import { ProfileDashboard } from '@/widgets/profile'

export function MainPage() {
  return (
    <>
      <ProfileDashboard />
      <ModeButton variant="levelup" />
      <RecentListHeader variant="levelup" />
      <RecentCardList />
    </>
  )
}

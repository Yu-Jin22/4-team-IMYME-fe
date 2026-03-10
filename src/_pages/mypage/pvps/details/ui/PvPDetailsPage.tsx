import { PvPFeedbackView } from '@/widgets/pvp-feedback'

export function PvPDetailsPage() {
  return (
    <PvPFeedbackView
      variant="details"
      messages={{
        loading: '대결 기록을 불러오는 중입니다...',
        error: '대결 기록을 불러오지 못했습니다.',
        empty: '표시할 대결 기록이 없습니다.',
      }}
    />
  )
}

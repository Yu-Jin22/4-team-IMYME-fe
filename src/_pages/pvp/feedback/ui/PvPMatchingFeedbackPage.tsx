import { PvPFeedbackView } from '@/widgets/pvp-feedback'

export function PvPMatchingFeedbackPage() {
  return (
    <PvPFeedbackView
      variant="matching"
      messages={{
        loading: '대결 피드백을 불러오는 중입니다.',
        error: '대결 피드백을 불러오지 못했습니다.',
        empty: '표시할 피드백이 없습니다.',
      }}
    />
  )
}

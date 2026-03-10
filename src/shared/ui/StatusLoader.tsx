import { Spinner } from './Spinner'

export type StatusLoaderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
export type StatusLoaderProcessingStep = 'AUDIO_ANALYSIS' | 'FEEDBACK_GENERATION'

type StatusLoaderProps =
  | {
      title: string
      description: string
    }
  | {
      status: StatusLoaderStatus
      step?: StatusLoaderProcessingStep | null
    }

const STATUS_COPY: Record<StatusLoaderStatus, { title: string; description: string }> = {
  PENDING: {
    title: '음성 제출 중...',
    description: '음성을 제출 중입니다.',
  },
  PROCESSING: {
    title: '음성 변환 중...',
    description: 'AI가 당신의 음성을 변환 중입니다.',
  },
  COMPLETED: {
    title: '분석 완료',
    description: '피드백을 준비하고 있습니다.',
  },
  FAILED: {
    title: '처리 실패',
    description: '음성 처리에 실패했습니다. 다시 시도해주세요.',
  },
  EXPIRED: {
    title: '처리 만료',
    description: '요청 시간이 만료되었습니다. 다시 시도해주세요.',
  },
}

const PROCESSING_STEP_COPY: Record<
  StatusLoaderProcessingStep,
  { title: string; description: string }
> = {
  AUDIO_ANALYSIS: {
    title: '음성 분석 중...',
    description: 'STT 변환이 진행되고 있습니다.',
  },
  FEEDBACK_GENERATION: {
    title: '피드백 생성 중...',
    description: 'AI가 채점 및 피드백을 생성하고 있습니다.',
  },
}

const WRAPPER_CLASSNAME = 'mt-4 flex w-full items-center justify-center self-center'
const BOX_CLASSNAME =
  'border-secondary flex h-90 w-90 flex-col items-center justify-center gap-5 rounded-2xl border'
const INNER_CLASSNAME = 'bg-secondary flex h-20 w-20 items-center justify-center rounded-full'

export function StatusLoader(props: StatusLoaderProps) {
  let resolvedTitle: string
  let resolvedDescription: string

  if ('status' in props) {
    const copy =
      props.status === 'PROCESSING' && props.step
        ? PROCESSING_STEP_COPY[props.step]
        : STATUS_COPY[props.status]

    resolvedTitle = copy.title
    resolvedDescription = copy.description
  } else {
    resolvedTitle = props.title
    resolvedDescription = props.description
  }

  return (
    <div className={WRAPPER_CLASSNAME}>
      <div className={BOX_CLASSNAME}>
        <div className={INNER_CLASSNAME}>
          <Spinner className="size-8" />
        </div>
        <p className="mt-5 text-sm">{resolvedTitle}</p>
        <p className="text-sm">{resolvedDescription}</p>
      </div>
    </div>
  )
}

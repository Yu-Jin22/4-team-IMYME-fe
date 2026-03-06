'use client'

type MicrophoneBoxSkeletonProps = {
  titleLineWidthClassName?: string
  descriptionLineWidthClassName?: string
}

const WRAPPER_CLASSNAME = 'mt-4 flex w-full flex-col items-center'
const BOX_CLASSNAME =
  'border-secondary bg-var(--color-background) flex h-90 w-90 flex-col items-center gap-6 rounded-2xl border-2'
const DEFAULT_TITLE_LINE_WIDTH_CLASSNAME = 'w-40'
const DEFAULT_DESCRIPTION_LINE_WIDTH_CLASSNAME = 'w-56'
const SKELETON_BASE_CLASSNAME = 'animate-pulse rounded-md bg-gray-200'
const MIC_BUTTON_SKELETON_CLASSNAME =
  'border-secondary flex h-40 w-40 items-center justify-center rounded-full border-4'
const MIC_ICON_SKELETON_CLASSNAME = 'h-24 w-24 rounded-full bg-gray-200'
const STATUS_LINE_SKELETON_CLASSNAME = 'h-4 w-30 animate-pulse rounded-md bg-gray-200'

export function MicrophoneBoxSkeleton({
  titleLineWidthClassName = DEFAULT_TITLE_LINE_WIDTH_CLASSNAME,
  descriptionLineWidthClassName = DEFAULT_DESCRIPTION_LINE_WIDTH_CLASSNAME,
}: MicrophoneBoxSkeletonProps) {
  return (
    <div className={WRAPPER_CLASSNAME}>
      <div
        className={BOX_CLASSNAME}
        aria-busy={true}
      >
        <div className={`mt-6 h-4 ${titleLineWidthClassName} ${SKELETON_BASE_CLASSNAME}`} />
        <div className={`h-4 ${descriptionLineWidthClassName} ${SKELETON_BASE_CLASSNAME}`} />
        <div className="h-4 w-48 animate-pulse rounded-md bg-gray-200/80" />

        <div className={MIC_BUTTON_SKELETON_CLASSNAME}>
          <div className={MIC_ICON_SKELETON_CLASSNAME} />
        </div>

        <div className={STATUS_LINE_SKELETON_CLASSNAME} />
      </div>
    </div>
  )
}

type CategorySelectSkeletonProps = {
  variant?: 'default' | 'compact'
}

const CATEGORY_SKELETON_ITEM_COUNT = 8
const CATEGORY_LIST_CLASSNAME =
  'itmes-center grid min-h-0 w-full flex-1 grid-cols-2 place-items-center gap-6 overflow-y-scroll'
const CATEGORY_SKELETON_BASE_CLASSNAME = 'w-40 rounded-2xl bg-white/70 animate-pulse'

export function CategorySelectSkeleton({ variant = 'default' }: CategorySelectSkeletonProps) {
  const buttonHeightClassName = variant === 'compact' ? 'h-20' : 'h-40'

  return (
    <div
      className={CATEGORY_LIST_CLASSNAME}
      aria-busy={true}
    >
      {Array.from({ length: CATEGORY_SKELETON_ITEM_COUNT }).map((_, index) => (
        <div
          key={index}
          className={`${buttonHeightClassName} ${CATEGORY_SKELETON_BASE_CLASSNAME}`}
        />
      ))}
    </div>
  )
}

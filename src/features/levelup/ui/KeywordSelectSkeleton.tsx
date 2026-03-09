const KEYWORD_SKELETON_ITEM_COUNT = 8
const KEYWORD_LIST_CLASSNAME = 'itmes-center flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto'
const KEYWORD_SKELETON_ITEM_CLASSNAME = 'min-h-10 w-80 rounded-2xl bg-white/70 animate-pulse'

export function KeywordSelectSkeleton() {
  return (
    <div
      className={KEYWORD_LIST_CLASSNAME}
      aria-busy={true}
    >
      {Array.from({ length: KEYWORD_SKELETON_ITEM_COUNT }).map((_, index) => (
        <div
          key={index}
          className={KEYWORD_SKELETON_ITEM_CLASSNAME}
        />
      ))}
    </div>
  )
}

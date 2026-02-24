'use client'

type PvPCategoryProps = {
  categoryName?: string
  label?: string
}

const WRAPPER_CLASSNAME = 'mt-5'
const TEXT_CLASSNAME = 'mr-auto ml-10 text-sm'
const DEFAULT_LABEL = '대결 카테고리'

export function PvPCategory({ categoryName = '', label = DEFAULT_LABEL }: PvPCategoryProps) {
  return (
    <div className={WRAPPER_CLASSNAME}>
      <p className={TEXT_CLASSNAME}>
        {label} {categoryName}
      </p>
    </div>
  )
}

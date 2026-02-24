'use client'

type PvPKeywordProps = {
  keywordName?: string
  label?: string
}

const WRAPPER_CLASSNAME = 'mt-5 flex w-full flex-col items-center justify-center gap-4'
const KEYWORD_BOX_CLASSNAME = 'bg-secondary flex h-12 w-80 items-center justify-center rounded-2xl'
const DEFAULT_LABEL = '대결 키워드'

export function PvPKeyword({ keywordName = '', label = DEFAULT_LABEL }: PvPKeywordProps) {
  return (
    <div className={WRAPPER_CLASSNAME}>
      <p className="text-sm">{label}</p>
      <div className={KEYWORD_BOX_CLASSNAME}>
        <p>{keywordName}</p>
      </div>
    </div>
  )
}

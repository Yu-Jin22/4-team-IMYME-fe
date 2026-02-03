'use client'

import { SubjectCard } from './SubjectCard'

type SubjectHeaderVariant = 'in_progress' | 'completed'

type SubjectHeaderProps = {
  variant: SubjectHeaderVariant
  categoryValue: string
  keywordValue: string
}

const WRAPPER_CLASSNAME = 'mt-6 flex justify-center gap-6'

const TITLE_BY_VARIANT: Record<SubjectHeaderVariant, { category: string; keyword: string }> = {
  in_progress: {
    category: '학습 중인 카테고리',
    keyword: '학습 중인 키워드',
  },
  completed: {
    category: '학습한 카테고리',
    keyword: '학습한 키워드',
  },
}

export function SubjectHeader({ categoryValue, keywordValue, variant }: SubjectHeaderProps) {
  const titles = TITLE_BY_VARIANT[variant]

  return (
    <div className={WRAPPER_CLASSNAME}>
      <SubjectCard
        variant="category"
        title={titles.category}
        value={categoryValue}
      />
      <SubjectCard
        variant="keyword"
        title={titles.keyword}
        value={keywordValue}
      />
    </div>
  )
}

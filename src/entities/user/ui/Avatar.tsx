'use client'

import Image from 'next/image'
import { useState } from 'react'

import { DefaultAvatar } from '@/shared'

interface AvatarProps {
  avatar_src: string
  size: number
  onError?: () => void
}

const KAKAO_CDN_HTTP_PREFIX = 'http://k.kakaocdn.net'
const KAKAO_CDN_HTTPS_PREFIX = 'https://k.kakaocdn.net'
const S3_HTTP_PREFIX = 'http://imymemine1.s3.ap-northeast-2.amazonaws.com'
const S3_HTTPS_PREFIX = 'https://imymemine1.s3.ap-northeast-2.amazonaws.com'
const PLACEHOLDER_CLASSNAME = 'absolute inset-0 rounded-full bg-secondary/60'

const normalizeAvatarSrc = (src: string) => {
  if (src.startsWith(KAKAO_CDN_HTTP_PREFIX)) {
    return `${KAKAO_CDN_HTTPS_PREFIX}${src.slice(KAKAO_CDN_HTTP_PREFIX.length)}`
  }
  if (src.startsWith(S3_HTTP_PREFIX)) {
    return `${S3_HTTPS_PREFIX}${src.slice(S3_HTTP_PREFIX.length)}`
  }
  return src
}

export function Avatar({ avatar_src, size, onError }: AvatarProps) {
  const isFallback = !avatar_src
  const src = isFallback ? DefaultAvatar : normalizeAvatarSrc(avatar_src)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(isFallback ? src : null)
  const isImageLoaded = isFallback || loadedSrc === src

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center overflow-hidden rounded-full"
    >
      {isImageLoaded ? null : <div className={PLACEHOLDER_CLASSNAME} />}
      <Image
        src={src}
        alt="profile image"
        width={size}
        height={size}
        className={[
          'h-full w-full object-cover object-center transition-opacity duration-200',
          isImageLoaded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onError={onError}
        priority={isFallback}
        onLoad={() => {
          setLoadedSrc(src)
        }}
      />
    </div>
  )
}

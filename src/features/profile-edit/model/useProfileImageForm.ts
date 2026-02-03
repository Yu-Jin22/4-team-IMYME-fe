import { type ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react'

import { validateProfileImage } from './validateProfileImage'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']

const ERROR_MESSAGES: Record<'unsupported-type' | 'file-too-large', string> = {
  'unsupported-type': '지원하지 않는 이미지 형식입니다.',
  'file-too-large': '이미지 용량은 5MB 이하만 가능합니다.',
}

export function useProfileImageForm() {
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const latestPreviewRef = useRef<string | null>(null)

  useEffect(() => {
    latestPreviewRef.current = imagePreview
  }, [imagePreview])

  useEffect(() => {
    return () => {
      if (latestPreviewRef.current) {
        URL.revokeObjectURL(latestPreviewRef.current)
      }
    }
  }, [])

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }

      const file = event.target.files?.[0]

      if (!file) {
        setErrorMessage(null)
        setError(false)
        setFile(null)
        setImagePreview(null)
        return
      }

      const validation = validateProfileImage(file)
      if (!validation.ok) {
        setError(true)
        setErrorMessage(ERROR_MESSAGES[validation.reason])
        setFile(null)
        setImagePreview(null)
        return
      }

      const nextPreview = URL.createObjectURL(file)
      setImagePreview(nextPreview)
      setFile(file)
      setError(false)
      setErrorMessage(null)
    },
    [imagePreview],
  )

  return {
    acceptTypes: ACCEPTED_TYPES.join(','),
    error,
    errorMessage,
    file,
    imagePreview,
    handleFileChange,
  }
}

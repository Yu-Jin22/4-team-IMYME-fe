export const SUPPORTED_AUDIO_CONTENT_TYPES = [
  'audio/mp4',
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
] as const

export type SupportedAudioContentType = (typeof SUPPORTED_AUDIO_CONTENT_TYPES)[number]

const DEFAULT_AUDIO_CONTENT_TYPE: SupportedAudioContentType = 'audio/webm'

const MIME_TO_CONTENT_TYPE_MAP: Record<string, SupportedAudioContentType> = {
  'audio/webm': 'audio/webm',
  'audio/mp4': 'audio/mp4',
  'audio/wav': 'audio/wav',
  'audio/mpeg': 'audio/mpeg',
}

export const resolveAudioContentType = (mimeType: string): SupportedAudioContentType => {
  return MIME_TO_CONTENT_TYPE_MAP[mimeType] ?? DEFAULT_AUDIO_CONTENT_TYPE
}

export const isSupportedAudioContentType = (
  contentType: string | null | undefined,
): contentType is SupportedAudioContentType =>
  typeof contentType === 'string' &&
  SUPPORTED_AUDIO_CONTENT_TYPES.includes(contentType as SupportedAudioContentType)

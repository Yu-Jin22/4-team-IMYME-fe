export const MAX_NAME_LENGTH = 20
export const MIN_NAME_LENGTH = 1

const NAME_ALLOWED_PATTERN = /^[A-Za-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]+$/
const INVALID_NAME_MESSAGE = '공백, 특수문자, 이모지는 사용할 수 없습니다.'
const LENGTH_MESSAGE = `카드 이름은 ${MIN_NAME_LENGTH}자 이상 ${MAX_NAME_LENGTH}자 이하여야 합니다.`

export type NameValidationResult = { ok: true } | { ok: false; reason: string }

export const validateCardName = (value: string): NameValidationResult => {
  if (value.length < MIN_NAME_LENGTH || value.length > MAX_NAME_LENGTH) {
    return { ok: false, reason: LENGTH_MESSAGE }
  }

  if (!NAME_ALLOWED_PATTERN.test(value)) {
    return { ok: false, reason: INVALID_NAME_MESSAGE }
  }

  return { ok: true }
}

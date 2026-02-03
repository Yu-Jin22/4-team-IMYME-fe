import { HelperText } from '@/shared'
import { Input } from '@/shared/ui/input'

import type { ChangeEventHandler, FocusEventHandler } from 'react'

type NicknameInputProps = {
  value: string
  placeholder: string
  onChange: ChangeEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  helperMessage?: string | null
  helperVariant?: 'default' | 'error'
}

export function NicknameInput({
  value,
  placeholder,
  onChange,
  onBlur,
  helperMessage = null,
  helperVariant = 'default',
}: NicknameInputProps) {
  return (
    <>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        minLength={2}
      />
      <div className="flex min-h-4 w-full">
        {helperMessage ? (
          <HelperText
            message={helperMessage}
            variant={helperVariant}
          />
        ) : null}
      </div>
    </>
  )
}

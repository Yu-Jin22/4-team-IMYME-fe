const DATE_SEPARATOR = '.'
const PAD_LENGTH = 2
const PAD_CHAR = '0'
const MONTH_OFFSET = 1

export const formatDate = (isoDate: string) => {
  const date = new Date(isoDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + MONTH_OFFSET).padStart(PAD_LENGTH, PAD_CHAR)
  const day = String(date.getDate()).padStart(PAD_LENGTH, PAD_CHAR)

  return `${year}${DATE_SEPARATOR}${month}${DATE_SEPARATOR}${day}`
}

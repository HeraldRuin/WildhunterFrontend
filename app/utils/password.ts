const PASSWORD_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
const PASSWORD_DIGITS = '0123456789'

export function generatePassword(length = 8): string {
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)

  const passwordChars = Array.from(
    randomValues,
    (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length],
  )

  if (!passwordChars.some((char) => PASSWORD_DIGITS.includes(char))) {
    const [digitIndex, digitValue] = crypto.getRandomValues(new Uint32Array(2))
    passwordChars[digitIndex % length] = PASSWORD_DIGITS[digitValue % PASSWORD_DIGITS.length]
  }

  return passwordChars.join('')
}

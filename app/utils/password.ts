const PASSWORD_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
const PASSWORD_DIGITS = '0123456789'

export function generatePassword(length = 8): string {
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)

  const passwordChars = Array.from(
    randomValues,
    value => PASSWORD_CHARS.charAt(value % PASSWORD_CHARS.length),
  )

  if (!passwordChars.some((char) => PASSWORD_DIGITS.includes(char))) {
    const digitValues = crypto.getRandomValues(new Uint32Array(2))
    const digitIndex = digitValues[0] ?? 0
    const digitValue = digitValues[1] ?? 0
    passwordChars[digitIndex % length] = PASSWORD_DIGITS.charAt(digitValue % PASSWORD_DIGITS.length)
  }

  return passwordChars.join('')
}

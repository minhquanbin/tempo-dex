import { TOKEN_DECIMALS } from '../constants/tokens'

/**
 * Format token amount cho hiển thị
 * @param amount - Amount in wei (bigint)
 * @param decimals - Token decimals
 * @returns Formatted string
 */
export function formatTokenAmount(
  amount: bigint | undefined,
  decimals: number = TOKEN_DECIMALS
): string {
  if (!amount) return '0'
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const fraction = amount % divisor
  const fractionStr = fraction.toString().padStart(decimals, '0')
  return `${whole}.${fractionStr.slice(0, 4)}`
}

/**
 * Parse user input thành token amount
 * @param value - User input string
 * @param decimals - Token decimals
 * @returns Amount in wei (bigint)
 */
export function parseTokenAmount(
  value: string,
  decimals: number = TOKEN_DECIMALS
): bigint {
  const [whole, fraction = ''] = value.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFraction)
}
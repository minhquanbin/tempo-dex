import { TOKEN_DECIMALS } from '../constants/tokens'

// CCIP-BnM uses 18 decimals (ERC20 standard)
export const CCIP_BNM_DECIMALS = 18

/**
 * Format token amount cho hiển thị
 * @param amount - Amount in wei (bigint)
 * @param decimals - Token decimals
 * @param maxDecimals - Maximum decimal places to show
 * @returns Formatted string
 */
export function formatTokenAmount(
  amount: bigint | undefined,
  decimals: number = TOKEN_DECIMALS,
  maxDecimals: number = 4
): string {
  if (!amount) return '0'
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const fraction = amount % divisor
  const fractionStr = fraction.toString().padStart(decimals, '0')
  
  // Truncate to maxDecimals and remove trailing zeros
  const truncated = fractionStr.slice(0, maxDecimals).replace(/0+$/, '')
  
  return truncated ? `${whole}.${truncated}` : `${whole}`
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
  if (!value || value === '0') return 0n
  const [whole, fraction = ''] = value.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFraction)
}
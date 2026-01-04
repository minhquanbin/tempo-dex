/**
 * Tính toán maxAmountIn với slippage tolerance
 * @param amount - Base amount
 * @param slippagePercent - Slippage percentage (e.g., 0.5 for 0.5%)
 * @returns maxAmountIn với slippage
 */
export function calculateMaxAmountIn(
  amount: bigint,
  slippagePercent: number = 0.5
): bigint {
  const slippageTolerance = slippagePercent / 100
  const multiplier = BigInt(Math.floor((1 + slippageTolerance) * 1000))
  return (amount * multiplier) / 1000n
}

/**
 * Tính toán minAmountOut với slippage tolerance
 * @param amount - Base amount
 * @param slippagePercent - Slippage percentage (e.g., 0.5 for 0.5%)
 * @returns minAmountOut với slippage
 */
export function calculateMinAmountOut(
  amount: bigint,
  slippagePercent: number = 0.5
): bigint {
  const slippageTolerance = slippagePercent / 100
  const multiplier = BigInt(Math.floor((1 - slippageTolerance) * 1000))
  return (amount * multiplier) / 1000n
}
import { TOKEN_NAMES } from '../../constants/tokens'
import { formatTokenAmount } from '../../utils/formatting'
import { calculateMaxAmountIn } from '../../utils/slippage'

interface QuoteDisplayProps {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  amountOut: bigint
  slippage: number
}

export default function QuoteDisplay({
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  slippage,
}: QuoteDisplayProps) {
  const tokenInName = TOKEN_NAMES[tokenIn as keyof typeof TOKEN_NAMES]
  const tokenOutName = TOKEN_NAMES[tokenOut as keyof typeof TOKEN_NAMES]

  // Calculate exchange rate
  const rate = amountIn > 0n 
    ? Number(amountOut) / Number(amountIn)
    : 0

  // Calculate minimum received with slippage
  const maxAmountIn = calculateMaxAmountIn(amountIn, slippage)
  const slippageAmount = maxAmountIn - amountIn

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Exchange Rate</span>
        <span className="font-semibold text-gray-800">
          1 {tokenInName} = {rate.toFixed(4)} {tokenOutName}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Max Slippage</span>
        <span className="font-semibold text-gray-800">{slippage}%</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Max Amount In</span>
        <span className="font-semibold text-gray-800">
          {formatTokenAmount(maxAmountIn)} {tokenInName}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Slippage Protection</span>
        <span className="font-semibold text-indigo-600">
          +{formatTokenAmount(slippageAmount)} {tokenInName}
        </span>
      </div>

      <div className="border-t border-indigo-200 pt-2 mt-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">You'll receive</span>
          <span className="font-bold text-lg text-indigo-700">
            {formatTokenAmount(amountOut)} {tokenOutName}
          </span>
        </div>
      </div>
    </div>
  )
}
import { formatTokenAmount } from '../../utils/formatting'
import { ESTIMATED_BRIDGE_TIME } from '../../constants/ccip'

interface BridgeQuoteProps {
  amount: bigint
  fee: bigint
  tokenSymbol: string
  sourceChain: string
  destinationChain: string
  estimatedTime?: number
}

function BridgeQuote({
  amount,
  fee,
  tokenSymbol,
  sourceChain,
  destinationChain,
  estimatedTime = ESTIMATED_BRIDGE_TIME.NORMAL,
}: BridgeQuoteProps) {
  const feeInToken = formatTokenAmount(fee)
  const amountToReceive = amount

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `~${minutes} min`
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 space-y-3 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl">🌉</div>
        <h3 className="font-bold text-gray-800">Bridge Details</h3>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Route</span>
          <span className="font-semibold text-gray-800">
            {sourceChain} → {destinationChain}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount to Bridge</span>
          <span className="font-semibold text-gray-800">
            {formatTokenAmount(amount)} {tokenSymbol}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Bridge Fee (CCIP)</span>
          <span className="font-semibold text-orange-600">
            {feeInToken} {tokenSymbol}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Estimated Time</span>
          <span className="font-semibold text-blue-600">
            {formatTime(estimatedTime)}
          </span>
        </div>

        <div className="border-t-2 border-blue-200 pt-2 mt-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">You'll Receive</span>
            <span className="font-bold text-lg text-indigo-700">
              {formatTokenAmount(amountToReceive)} {tokenSymbol}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 rounded-lg p-3 flex items-start gap-2 mt-3">
        <div className="text-lg">ℹ️</div>
        <div className="text-xs text-blue-800">
          <p className="font-semibold mb-1">Cross-chain transfer via Chainlink CCIP</p>
          <p>Your tokens will arrive on {destinationChain} in approximately {formatTime(estimatedTime)}. You can track the progress using the transaction hash.</p>
        </div>
      </div>
    </div>
  )
}

export default BridgeQuote
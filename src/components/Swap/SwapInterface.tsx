import { useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS, TOKEN_NAMES } from '../../constants/tokens'
import TokenSelector from './TokenSelector'
import QuoteDisplay from './QuoteDisplay'
import useSwap from '../../hooks/useSwap'
import { parseTokenAmount, formatTokenAmount } from '../../utils/formatting'
import TokenBalance from '../Common/TokenBalance'

export default function SwapInterface() {
  const { isConnected } = useAccount()
  const [tokenIn, setTokenIn] = useState(TOKENS.AlphaUSD)
  const [tokenOut, setTokenOut] = useState(TOKENS.BetaUSD)
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState(0.5)

  const { quote, isLoadingQuote, executeSwap, isSwapping, error } = useSwap({
    tokenIn,
    tokenOut,
    amountIn: amountIn ? parseTokenAmount(amountIn) : 0n,
    slippage,
  })

  const handleSwap = async () => {
    if (!amountIn || !quote) return
    await executeSwap()
    setAmountIn('') // Reset input after swap
  }

  const handleFlipTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
  }

  const availableTokens = [TOKENS.AlphaUSD, TOKENS.BetaUSD, TOKENS.ThetaUSD]

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Swap Tokens</h2>

      {!isConnected ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Please connect your wallet to swap</p>
          <div className="text-4xl">🔐</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Token Input */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600 font-medium">From</label>
              <TokenBalance token={tokenIn} />
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-xl font-semibold focus:outline-none focus:border-indigo-500"
                step="0.01"
              />
              <TokenSelector
                selected={tokenIn}
                options={availableTokens.filter((t) => t !== tokenOut)}
                onChange={setTokenIn}
              />
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleFlipTokens}
              className="bg-white border-4 border-gray-100 rounded-full p-2 hover:bg-gray-50 transition-all hover:rotate-180 duration-300"
            >
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          {/* Token Output */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600 font-medium">To</label>
              <TokenBalance token={tokenOut} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-xl font-semibold text-gray-500">
                {quote ? formatTokenAmount(quote) : '0.0'}
              </div>
              <TokenSelector
                selected={tokenOut}
                options={availableTokens.filter((t) => t !== tokenIn)}
                onChange={setTokenOut}
              />
            </div>
          </div>

          {/* Quote Display */}
          {quote && amountIn && (
            <QuoteDisplay
              tokenIn={tokenIn}
              tokenOut={tokenOut}
              amountIn={parseTokenAmount(amountIn)}
              amountOut={quote}
              slippage={slippage}
            />
          )}

          {/* Slippage Settings */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-700 font-medium">
                Slippage Tolerance
              </label>
              <span className="text-sm font-semibold text-indigo-600">
                {slippage}%
              </span>
            </div>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    slippage === val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!amountIn || !quote || isSwapping || isLoadingQuote}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              !amountIn || !quote || isSwapping || isLoadingQuote
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isLoadingQuote
              ? '⏳ Getting Quote...'
              : isSwapping
              ? '🔄 Swapping...'
              : '🚀 Swap'}
          </button>
        </div>
      )}
    </div>
  )
}
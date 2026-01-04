import { useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS } from '../../constants/tokens'
import TokenSelector from './TokenSelector'
import QuoteDisplay from './QuoteDisplay'
import useSwap from '../../hooks/useSwap'
import { parseTokenAmount, formatTokenAmount } from '../../utils/formatting'
import TokenBalance from '../Common/TokenBalance'

export default function SwapInterface() {
  const { isConnected } = useAccount()
  const [tokenIn, setTokenIn] = useState<string>(TOKENS.AlphaUSD)
  const [tokenOut, setTokenOut] = useState<string>(TOKENS.BetaUSD)
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState(0.5)

  const { 
    quote, 
    isLoadingQuote, 
    executeSwap, 
    isSwapping, 
    needsApproval,
    isApproveSuccess,
    isSwapSuccess,
    error 
  } = useSwap({
    tokenIn,
    tokenOut,
    amountIn: amountIn ? parseTokenAmount(amountIn) : 0n,
    slippage,
  })

  const handleSwap = async () => {
    if (!amountIn || !quote) return
    await executeSwap()
    
    if (isSwapSuccess) {
      setAmountIn('')
    }
  }

  const handleFlipTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
  }

  const availableTokens = [TOKENS.AlphaUSD, TOKENS.BetaUSD, TOKENS.ThetaUSD]

  const getButtonText = () => {
    if (isLoadingQuote) return '⏳ Getting Quote...'
    if (isSwapping) {
      if (needsApproval && !isApproveSuccess) return '⏳ Approving...'
      return '🔄 Swapping...'
    }
    if (needsApproval) return '✅ Approve Token'
    return '🚀 Swap'
  }

  const isButtonDisabled = !amountIn || !quote || isSwapping || isLoadingQuote

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
      {!isConnected ? (
        <div className="text-center py-20 px-4">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">🔄</div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Swap Tokens</h3>
          <p className="text-gray-500 mb-6">Connect your wallet to start swapping stablecoins</p>
          <div className="inline-block px-6 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
            Connect wallet above ↗️
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Token Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-600">From</label>
              <TokenBalance token={tokenIn} />
            </div>
            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-3xl font-bold focus:outline-none text-gray-800 placeholder-gray-400"
                  step="0.01"
                />
                <TokenSelector
                  selected={tokenIn}
                  options={availableTokens.filter((t) => t !== tokenOut)}
                  onChange={(token: string) => setTokenIn(token)}
                />
              </div>
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleFlipTokens}
              className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:rotate-180 duration-300"
            >
              <svg
                className="w-6 h-6"
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
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-600">To</label>
              <TokenBalance token={tokenOut} />
            </div>
            <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
              <div className="flex gap-3 items-center">
                <div className="flex-1 text-3xl font-bold text-gray-800">
                  {quote ? formatTokenAmount(quote) : '0.0'}
                </div>
                <TokenSelector
                  selected={tokenOut}
                  options={availableTokens.filter((t) => t !== tokenIn)}
                  onChange={(token: string) => setTokenOut(token)}
                />
              </div>
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

          {/* Approval Success Message */}
          {isApproveSuccess && needsApproval && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <p className="text-green-800 font-semibold">Token Approved!</p>
                <p className="text-green-600 text-sm">Click the button below to complete your swap</p>
              </div>
            </div>
          )}

          {/* Slippage Settings */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-gray-700">
                Slippage Tolerance
              </label>
              <span className="text-lg font-bold text-orange-600">
                {slippage}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0.1, 0.5, 1.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    slippage === val
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
              <div className="text-2xl">❌</div>
              <p className="text-red-700 text-sm flex-1">{error}</p>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={isButtonDisabled}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              isButtonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {getButtonText()}
          </button>

          {/* Info about two-step process */}
          {needsApproval && amountIn && quote && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Two-step process:</p>
                <p>First approve the token, then click swap again to complete the transaction.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
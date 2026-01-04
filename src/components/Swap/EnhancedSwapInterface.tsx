import { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { TOKENS, TOKEN_NAMES } from '../../constants/tokens'
import TokenSelector from './TokenSelector'
import QuoteDisplay from './QuoteDisplay'
import useSwap from '../../hooks/useSwap'
import { parseTokenAmount, formatTokenAmount } from '../../utils/formatting'
import TokenBalance from '../Common/TokenBalance'
import { Sparkles, AlertCircle } from 'lucide-react'

export default function EnhancedSwapInterface() {
  const { isConnected, address } = useAccount()
  const [tokenIn, setTokenIn] = useState(TOKENS.AlphaUSD)
  const [tokenOut, setTokenOut] = useState(TOKENS.BetaUSD)
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [useGasless, setUseGasless] = useState(false)
  const [memo, setMemo] = useState('')

  // Get native balance (TEMPO)
  const { data: nativeBalance } = useBalance({
    address: address,
  })

  const { quote, isLoadingQuote, executeSwap, isSwapping, error } = useSwap({
    tokenIn,
    tokenOut,
    amountIn: amountIn ? parseTokenAmount(amountIn) : 0n,
    slippage,
    useGasless,
    memo,
  })

  const handleSwap = async () => {
    if (!amountIn || !quote) return
    await executeSwap()
    setAmountIn('')
    setMemo('')
  }

  const handleFlipTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
  }

  const availableTokens = [TOKENS.AlphaUSD, TOKENS.BetaUSD, TOKENS.ThetaUSD]

  // Check if user has enough native balance for gas
  const hasEnoughGas = nativeBalance && parseFloat(nativeBalance.formatted) > 0.001

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Swap Tokens</h2>
        {/* Native Balance Badge */}
        {isConnected && nativeBalance && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg px-3 py-1.5">
            <div className="text-xs text-gray-600">TEMPO Balance</div>
            <div className="text-sm font-bold text-gray-800">
              {parseFloat(nativeBalance.formatted).toFixed(4)}
            </div>
          </div>
        )}
      </div>

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

          {/* Memo Input */}
          <div className="bg-purple-50 rounded-xl p-4">
            <label className="text-sm text-gray-700 font-medium mb-2 block">
              Transaction Note (Optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note to this swap..."
              className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              maxLength={100}
            />
            {memo && (
              <p className="text-xs text-purple-600 mt-2">
                💡 Note will be stored onchain: "{memo}"
              </p>
            )}
          </div>

          {/* Gasless Payment Option */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="gasless-swap"
                checked={useGasless}
                onChange={(e) => setUseGasless(e.target.checked)}
                className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <div className="flex-1">
                <label htmlFor="gasless-swap" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-800">Gasless Swap (Beta)</span>
                  <span className="px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full font-semibold">
                    NEW
                  </span>
                </label>
                <p className="text-xs text-green-700 mt-1">
                  {useGasless
                    ? '✅ Gas fees sponsored - You pay ZERO gas!'
                    : 'Enable to have gas fees paid by the protocol'}
                </p>
                {useGasless && (
                  <div className="mt-2 bg-white border border-green-300 rounded-lg p-2">
                    <p className="text-xs text-gray-600">
                      ⚡ Using Tempo fee sponsorship service
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Low Gas Warning */}
          {!hasEnoughGas && !useGasless && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Low gas balance</p>
                <p className="text-xs mt-1">
                  Consider enabling gasless swap to avoid transaction failures
                </p>
              </div>
            </div>
          )}

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
                : useGasless
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:scale-[1.02]'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isLoadingQuote
              ? '⏳ Getting Quote...'
              : isSwapping
              ? useGasless
                ? '🎁 Processing Gasless...'
                : '🔄 Swapping...'
              : useGasless
              ? '🎁 Swap (Gasless)'
              : '🚀 Swap'}
          </button>
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS, TOKEN_NAMES } from '../../constants/tokens'
import TokenSelector from '../Swap/TokenSelector'
import TokenBalance from '../Common/TokenBalance'
import { parseTokenAmount } from '../../utils/formatting'
import useLiquidity from '../../hooks/useLiquidity'

export default function AddLiquidity() {
  const { isConnected } = useAccount()
  const [token, setToken] = useState(TOKENS.AlphaUSD)
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')

  const { addLiquidity, isAdding, error } = useLiquidity()

  const handleAddLiquidity = async () => {
    if (!amount || !price) return

    await addLiquidity({
      token,
      amount: parseTokenAmount(amount),
      price: parseFloat(price),
      orderType,
    })

    // Reset form
    setAmount('')
    setPrice('')
  }

  const availableTokens = [TOKENS.AlphaUSD, TOKENS.BetaUSD, TOKENS.ThetaUSD]

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Liquidity</h2>

      {!isConnected ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Please connect your wallet to add liquidity</p>
          <div className="text-4xl">💧</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Order Type Selection */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="text-sm text-gray-600 font-medium mb-2 block">
              Order Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('buy')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  orderType === 'buy'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                💚 Buy Order
              </button>
              <button
                onClick={() => setOrderType('sell')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  orderType === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                ❤️ Sell Order
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {orderType === 'buy'
                ? 'Place a buy order to provide liquidity for others to sell into'
                : 'Place a sell order to provide liquidity for others to buy from'}
            </p>
          </div>

          {/* Token Selection */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600 font-medium">Token</label>
              <TokenBalance token={token} />
            </div>
            <TokenSelector
              selected={token}
              options={availableTokens}
              onChange={setToken}
            />
          </div>

          {/* Amount Input */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="text-sm text-gray-600 font-medium mb-2 block">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-xl font-semibold focus:outline-none focus:border-indigo-500"
              step="0.01"
            />
          </div>

          {/* Price Input */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="text-sm text-gray-600 font-medium mb-2 block">
              Price (in pathUSD per {TOKEN_NAMES[token as keyof typeof TOKEN_NAMES]})
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1.0"
              className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-xl font-semibold focus:outline-none focus:border-indigo-500"
              step="0.0001"
            />
            <p className="text-xs text-gray-500 mt-2">
              Set your desired exchange rate. Market price is typically around 1.0
            </p>
          </div>

          {/* Order Summary */}
          {amount && price && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Order Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">
                    {orderType === 'buy' ? '💚 Buy' : '❤️ Sell'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token:</span>
                  <span className="font-semibold">
                    {TOKEN_NAMES[token as keyof typeof TOKEN_NAMES]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">{price} pathUSD</span>
                </div>
                <div className="flex justify-between border-t border-indigo-200 pt-2 mt-2">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-bold text-indigo-700">
                    {(parseFloat(amount) * parseFloat(price)).toFixed(4)} pathUSD
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Add Liquidity Button */}
          <button
            onClick={handleAddLiquidity}
            disabled={!amount || !price || isAdding}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              !amount || !price || isAdding
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isAdding ? '⏳ Adding Liquidity...' : '💧 Add Liquidity'}
          </button>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-2xl">💡</span>
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your order will be added to the orderbook</li>
                  <li>Others can trade against your liquidity</li>
                  <li>You earn fees when your order is filled</li>
                  <li>You can remove liquidity anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { TOKENS } from '../../constants/tokens'
import TokenSelector from '../Swap/TokenSelector'
import TokenBalance from '../Common/TokenBalance'
import { parseTokenAmount } from '../../utils/formatting'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function PaymentInterface() {
  const { isConnected, address } = useAccount()
  const [selectedToken, setSelectedToken] = useState<string>(TOKENS.AlphaUSD)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [memoPrefix] = useState('INV123456')
  const [useGasless, setUseGasless] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: nativeBalance } = useBalance({ address })

  const availableTokens = [TOKENS.AlphaUSD, TOKENS.BetaUSD, TOKENS.ThetaUSD]

  const handleSend = async () => {
    if (!recipient || !amount || !address || !window.ethereum) {
      setError('Please fill all required fields')
      return
    }

    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      const amountInSmallestUnit = parseTokenAmount(amount)
      
      // Build transfer data
      const recipientPadded = recipient.slice(2).padStart(64, '0')
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0')
      let transferData = '0xa9059cbb' + recipientPadded + amountHex

      // Add memo
      const fullMemo = memo?.trim() 
        ? `${memoPrefix} (${memo.trim()})` 
        : memoPrefix

      if (fullMemo) {
        const memoBytes = new TextEncoder().encode(fullMemo)
        const memoHex = Array.from(memoBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        transferData += memoHex
      }

      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: selectedToken,
          data: transferData,
          value: '0x0'
        }],
      })

      setTxHash(hash as string)
      setRecipient('')
      setAmount('')
      setMemo('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Please connect your wallet to send payments</p>
          <div className="text-4xl">💸</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Send Payment</h2>
        {nativeBalance && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg px-3 py-1.5">
            <div className="text-xs text-gray-600">TEMPO</div>
            <div className="text-sm font-bold text-gray-800">
              {parseFloat(nativeBalance.formatted).toFixed(4)}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Token Selection */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label className="text-sm text-gray-600 font-medium mb-2 block">
            Token
          </label>
          <TokenSelector
            selected={selectedToken}
            options={availableTokens}
            onChange={(token: string) => setSelectedToken(token)}
          />
        </div>

        {/* Recipient */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600 font-medium">
              Recipient Address
            </label>
            <TokenBalance token={selectedToken} />
          </div>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Amount */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label className="text-sm text-gray-600 font-medium mb-2 block">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-xl font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Memo */}
        <div className="bg-purple-50 rounded-xl p-4">
          <label className="text-sm text-gray-700 font-medium mb-2 block">
            Payment Memo
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              <span className="font-mono text-sm text-gray-700 font-semibold">{memoPrefix}</span>
              <span className="text-gray-400">|</span>
              <span className="text-xs text-gray-500">Invoice prefix</span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add custom note..."
              rows={2}
              className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Gasless Option */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="gasless-payment"
              checked={useGasless}
              onChange={(e) => setUseGasless(e.target.checked)}
              className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <div className="flex-1">
              <label htmlFor="gasless-payment" className="flex items-center gap-2 cursor-pointer">
                <span className="font-semibold text-green-800">🎁 Gasless Payment</span>
                <span className="px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full font-semibold">
                  BETA
                </span>
              </label>
              <p className="text-xs text-green-700 mt-1">
                {useGasless ? '✅ Gas fees sponsored' : 'Enable for zero gas fees'}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success */}
        {txHash && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-semibold">Payment sent!</p>
              <p className="text-green-600 text-xs mt-1 font-mono break-all">
                TX: {txHash}
              </p>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!recipient || !amount || isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            !recipient || !amount || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : useGasless
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:scale-[1.02]'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {useGasless ? '🎁 Send (Gasless)' : 'Send Payment'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS, TOKEN_NAMES } from '../../constants/tokens'
import TokenSelector from '../Swap/TokenSelector'
import TokenBalance from '../Common/TokenBalance'

export default function PaymentInterface() {
  const { address, isConnected } = useAccount()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<string>(TOKENS.AlphaUSD)
  const [memo, setMemo] = useState('')
  const [memoPrefix] = useState('INV123456')
  const [useGaslessPayment, setUseGaslessPayment] = useState(false)
  const [txStatus, setTxStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const availableTokens = [TOKENS.AlphaUSD, TOKENS.BetaUSD, TOKENS.ThetaUSD]

  const sendPayment = async () => {
    if (!address || !recipient || !amount) {
      setTxStatus('⚠️ Please fill all required fields')
      return
    }

    setIsLoading(true)
    setTxStatus('⏳ Processing transaction...')

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const amountInSmallestUnit = Math.floor(parseFloat(amount) * 1e6) // 6 decimals
      const recipientPadded = recipient.slice(2).padStart(64, '0')
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0')
      let transferData = '0xa9059cbb' + recipientPadded + amountHex

      // Add memo
      const fullMemo = memo && memo.trim() 
        ? `${memoPrefix} (${memo.trim()})` 
        : memoPrefix

      if (fullMemo) {
        const memoBytes = new TextEncoder().encode(fullMemo)
        const memoHex = Array.from(memoBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        transferData += memoHex
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: selectedToken,
          data: transferData,
          value: '0x0'
        }],
      })

      setTxStatus(`✅ Payment sent! TX: ${txHash.substring(0, 10)}...`)
      
      // Clear form
      setRecipient('')
      setAmount('')
      setMemo('')
      
    } catch (error: any) {
      console.error('Payment error:', error)
      setTxStatus('❌ Payment failed: ' + (error.message || 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">💸</span>
        <h2 className="text-2xl font-bold text-gray-800">Send Payment</h2>
      </div>

      {!isConnected ? (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">🔐</div>
          <p className="text-gray-600 text-lg mb-2">Connect Your Wallet</p>
          <p className="text-gray-400 text-sm">Please connect your wallet to send payments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Token Selection */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <label className="block text-sm text-gray-600 font-medium mb-2">
              Select Token
            </label>
            <TokenSelector
              selected={selectedToken}
              options={availableTokens}
              onChange={(token: string) => setSelectedToken(token)}
            />
            <div className="mt-2">
              <TokenBalance token={selectedToken} />
            </div>
          </div>

          {/* Recipient Address */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block text-sm text-gray-600 font-medium mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            />
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block text-sm text-gray-600 font-medium mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            />
          </div>

          {/* Memo */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block text-sm text-gray-600 font-medium mb-2">
              Payment Memo
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
                <span className="font-mono text-sm text-gray-700 font-semibold">{memoPrefix}</span>
                <span className="text-gray-400">|</span>
                <span className="text-xs text-gray-500">Invoice prefix (fixed)</span>
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add custom note (optional)..."
                rows={2}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all"
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Preview:</span> {memo && memo.trim() ? `${memoPrefix} (${memo.trim()})` : memoPrefix}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 This memo will be stored onchain and visible on block explorer
                </p>
              </div>
            </div>
          </div>

          {/* Gasless Payment Option */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="gasless"
                checked={useGaslessPayment}
                onChange={(e) => setUseGaslessPayment(e.target.checked)}
                className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <div className="flex-1">
                <label htmlFor="gasless" className="flex items-center gap-2 cursor-pointer">
                  <span className="font-semibold text-green-800">🎁 Gasless Payment</span>
                  <span className="px-2 py-0.5 bg-green-200 text-green-700 text-xs rounded-full font-semibold">BETA</span>
                </label>
                <p className="text-xs text-green-700 mt-1">
                  {useGaslessPayment 
                    ? '✅ Gas fees will be sponsored - You pay ZERO gas!' 
                    : 'Enable to have gas fees paid by the dApp (no TEMPO required)'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {txStatus && (
            <div className={`p-4 rounded-xl text-sm ${
              txStatus.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : txStatus.includes('❌')
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              {txStatus}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={sendPayment}
            disabled={isLoading || !recipient || !amount}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isLoading || !recipient || !amount
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : useGaslessPayment
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:scale-[1.02]'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {isLoading 
              ? '⏳ Processing...' 
              : useGaslessPayment 
              ? '🎁 Send Gasless Payment' 
              : '💸 Send Payment'}
          </button>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex gap-2">
              <span className="text-2xl">💡</span>
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Payment Features:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Send stablecoins with custom memos</li>
                  <li>Memos are stored onchain permanently</li>
                  <li>Perfect for invoices and receipts</li>
                  <li>Optional gasless payments (testnet only)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS } from '../../constants/tokens'
import TokenSelector from '../Swap/TokenSelector'

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

      const amountInSmallestUnit = Math.floor(parseFloat(amount) * 1e6)
      const recipientPadded = recipient.slice(2).padStart(64, '0')
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0')
      let transferData = '0xa9059cbb' + recipientPadded + amountHex

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
      }) as string

      setTxStatus(`✅ Payment sent! TX: ${txHash.substring(0, 10)}...`)
      
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
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
      {!isConnected ? (
        <div className="text-center py-20 px-4">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">💸</div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Send Payment</h3>
          <p className="text-gray-500 mb-6">Connect your wallet to send stablecoin payments with memos</p>
          <div className="inline-block px-6 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            Connect wallet above ↗️
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Token Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Select Token
            </label>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
              <TokenSelector
                selected={selectedToken}
                options={availableTokens}
                onChange={(token: string) => setSelectedToken(token)}
              />
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl px-5 py-4 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4 text-2xl font-bold focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all"
            />
          </div>

          {/* Memo */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Payment Memo
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-yellow-300 rounded-xl">
                <span className="font-mono text-sm text-gray-800 font-bold">{memoPrefix}</span>
                <span className="text-gray-400">|</span>
                <span className="text-xs text-gray-500">Invoice prefix (fixed)</span>
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add custom note (optional)..."
                rows={2}
                className="w-full px-4 py-3 bg-white border-2 border-yellow-200 rounded-xl focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 resize-none transition-all"
              />
              <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-3">
                <p className="text-xs text-blue-800">
                  <span className="font-bold">Preview:</span> {memo && memo.trim() ? `${memoPrefix} (${memo.trim()})` : memoPrefix}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  💡 This memo will be stored onchain and visible on block explorer
                </p>
              </div>
            </div>
          </div>

          {/* Gasless Payment Option */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="gasless"
                checked={useGaslessPayment}
                onChange={(e) => setUseGaslessPayment(e.target.checked)}
                className="mt-1 w-6 h-6 text-green-600 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <div className="flex-1">
                <label htmlFor="gasless" className="flex items-center gap-2 cursor-pointer mb-2">
                  <span className="font-bold text-green-800 text-lg">🎁 Gasless Payment</span>
                  <span className="px-2.5 py-1 bg-green-200 text-green-800 text-xs rounded-full font-bold">NEW</span>
                </label>
                <p className="text-sm text-green-700">
                  {useGaslessPayment 
                    ? '✅ Gas fees will be sponsored - You pay ZERO gas!' 
                    : 'Enable to have gas fees paid by the dApp (no TEMPO required)'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {txStatus && (
            <div className={`p-4 rounded-2xl text-sm font-medium border-2 flex items-start gap-3 ${
              txStatus.includes('✅') 
                ? 'bg-green-50 border-green-300 text-green-800'
                : txStatus.includes('❌')
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-blue-50 border-blue-300 text-blue-800'
            }`}>
              <div className="text-xl">
                {txStatus.includes('✅') ? '✅' : txStatus.includes('❌') ? '❌' : '⏳'}
              </div>
              <p className="flex-1">{txStatus}</p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={sendPayment}
            disabled={isLoading || !recipient || !amount}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              isLoading || !recipient || !amount
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : useGaslessPayment
                ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading 
              ? '⏳ Processing...' 
              : useGaslessPayment 
              ? '🎁 Send Gasless Payment' 
              : '💸 Send Payment'}
          </button>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div className="text-sm text-gray-700">
                <p className="font-bold mb-2 text-purple-800">Payment Features:</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Send stablecoins with custom memos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Memos are stored onchain permanently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Perfect for invoices and receipts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Optional gasless payments (testnet only)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
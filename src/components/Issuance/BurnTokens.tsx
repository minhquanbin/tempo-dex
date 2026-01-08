import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import TokenSelectorForIssuance from './TokenSelectorForIssuance'

// TIP-20 Token ABI for burning
const tokenAbi = [
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export default function BurnTokens() {
  const { address } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [decimals] = useState(6) // Default to 6 for TIP-20 testnet tokens

  const { 
    writeContract, 
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { 
    isLoading: isConfirming,
    isSuccess
  } = useWaitForTransactionReceipt({
    hash,
  })

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tokenAddress || !amount) {
      alert('Please fill all fields')
      return
    }

    try {
      const amountInSmallestUnit = parseUnits(amount, decimals)
      
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: 'burn',
        args: [amountInSmallestUnit],
      })
    } catch (err: any) {
      console.error('Burn error:', err)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">🔥</div>
        <h3 className="text-2xl font-bold text-orange-800 mb-2">
          Tokens Burned Successfully!
        </h3>
        <p className="text-orange-700 mb-4">
          {amount} tokens have been permanently removed from circulation
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all"
        >
          Burn More Tokens
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-200">
        <h3 className="font-bold text-orange-800 text-lg mb-2">🔥 Burn Tokens</h3>
        <p className="text-sm text-orange-700">
          Permanently remove tokens from circulation. This decreases total supply.
        </p>
      </div>

      <form onSubmit={handleBurn} className="space-y-4">
        {/* Token Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Token Contract Address
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            required
            className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl px-5 py-4 font-mono text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Amount to Burn
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            required
            step="0.000001"
            min="0"
            className="w-full bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl px-5 py-4 text-2xl font-bold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
          />
        </div>

        {/* Warning Box */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="text-sm text-red-700">
              <p className="font-bold mb-1">Warning: This action is irreversible!</p>
              <p>Burned tokens are permanently removed and cannot be recovered.</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {writeError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <p className="text-red-700 text-sm font-medium">
              ❌ {writeError.message}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || isConfirming || !address}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg ${
            isPending || isConfirming || !address
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isPending ? '⏳ Burning...' : isConfirming ? '⏳ Confirming...' : '🔥 Burn Tokens'}
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-gray-700">
            <p className="font-bold mb-2 text-blue-800">About Burning:</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>You must have ISSUER_ROLE on this token</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>You must have sufficient balance to burn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Total supply decreases by the burned amount</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Useful for deflationary tokenomics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'

// TIP-20 Token ABI for minting
const tokenAbi = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export default function MintTokens() {
  const { address } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [recipient, setRecipient] = useState('')
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

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tokenAddress || !recipient || !amount) {
      alert('Please fill all fields')
      return
    }

    try {
      const amountInSmallestUnit = parseUnits(amount, decimals)
      
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: 'mint',
        args: [recipient as `0x${string}`, amountInSmallestUnit],
      })
    } catch (err: any) {
      console.error('Mint error:', err)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          Tokens Minted Successfully!
        </h3>
        <p className="text-green-700 mb-4">
          {amount} tokens have been minted to {recipient.slice(0, 6)}...{recipient.slice(-4)}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
        >
          Mint More Tokens
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
        <h3 className="font-bold text-green-800 text-lg mb-2">➕ Mint New Tokens</h3>
        <p className="text-sm text-green-700">
          Create new tokens and send them to any address. Requires ISSUER_ROLE.
        </p>
      </div>

      <form onSubmit={handleMint} className="space-y-4">
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

        {/* Recipient */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
            className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl px-5 py-4 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
          />
          <button
            type="button"
            onClick={() => address && setRecipient(address)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Use my address
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Amount to Mint
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            required
            step="0.000001"
            min="0"
            className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4 text-2xl font-bold focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all"
          />
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
              : 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isPending ? '⏳ Minting...' : isConfirming ? '⏳ Confirming...' : '➕ Mint Tokens'}
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="text-sm text-gray-700">
            <p className="font-bold mb-2 text-yellow-800">Important Notes:</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>You must have ISSUER_ROLE granted on this token</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>Minting increases the total supply</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>Check supply cap limits before minting</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
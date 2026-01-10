import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { TOKENS } from '../../constants/tokens'
import { saveCreatedToken } from './TokenSelectorForIssuance'

// TIP-20 Token Factory ABI (CORRECT - 6 parameters with salt!)
const tokenFactoryAbi = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'currency', type: 'string' },
      { name: 'quoteToken', type: 'address' },
      { name: 'admin', type: 'address' },
      { name: 'salt', type: 'bytes32' }, // ✅ THÊM SALT
    ],
    name: 'createToken',
    outputs: [{ name: 'token', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Token Factory Address on Tempo Testnet (correct!)
const TOKEN_FACTORY = '0x20fc000000000000000000000000000000000000'

interface CreateStablecoinProps {
  onTokenCreated?: (tokenAddress: string) => void
}

export default function CreateStablecoin({ onTokenCreated }: CreateStablecoinProps) {
  const { address } = useAccount()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [quoteToken, setQuoteToken] = useState('0x20c0000000000000000000000000000000000000') // pathUSD default
  const [createdToken, setCreatedToken] = useState<string>('')

  const { 
    writeContract, 
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const { 
    isLoading: isConfirming,
    isSuccess,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !symbol || !currency || !address) {
      alert('Please fill all fields and connect wallet')
      return
    }

    try {
      writeContract({
        address: TOKEN_FACTORY as `0x${string}`,
        abi: tokenFactoryAbi,
        functionName: 'createToken',
        args: [
          name,
          symbol,
          currency,
          quoteToken as `0x${string}`,
          address as `0x${string}`, // admin = connected wallet
        ],
      })
    } catch (err: any) {
      console.error('Create token error:', err)
    }
  }

  // Extract created token address from receipt logs
  if (isSuccess && receipt && !createdToken) {
    // Parse logs to get token address
    const tokenCreatedLog = receipt.logs[0]
    if (tokenCreatedLog) {
      // Token address is typically in the first log
      const tokenAddr = tokenCreatedLog.address
      setCreatedToken(tokenAddr)
      
      // Save token to storage
      saveCreatedToken(tokenAddr, name, symbol).catch(err => {
        console.error('Failed to save token:', err)
      })
      
      // Callback to parent
      if (onTokenCreated) {
        onTokenCreated(tokenAddr)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
        <h3 className="font-bold text-yellow-800 text-lg mb-2">🪙 Create Your Stablecoin</h3>
        <p className="text-sm text-yellow-700">
          Deploy a new TIP-20 compliant stablecoin on Tempo Network with built-in compliance features.
        </p>
      </div>

      {!createdToken ? (
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Token Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Token Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Demo USD"
              required
              className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., DEMO"
              required
              maxLength={10}
              className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Currency (ISO 4217)
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
              required
              maxLength={3}
              className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">3-letter currency code (e.g., USD, EUR, GBP)</p>
          </div>

          {/* Quote Token */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Quote Token
            </label>
            <select
              value={quoteToken}
              onChange={(e) => setQuoteToken(e.target.value)}
              className="w-full bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
            >
              <option value="0x20c0000000000000000000000000000000000000">pathUSD (Recommended)</option>
              <option value={TOKENS.AlphaUSD}>AlphaUSD</option>
              <option value={TOKENS.BetaUSD}>BetaUSD</option>
              <option value={TOKENS.ThetaUSD}>ThetaUSD</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">Token used for price quotes and liquidity pairs</p>
          </div>

          {/* Admin Info */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
            <p className="text-sm text-indigo-700 mb-2">
              🔐 <strong>Admin Address:</strong>
            </p>
            <code className="block bg-white px-3 py-2 rounded text-xs font-mono break-all text-gray-800">
              {address || 'Connect wallet first'}
            </code>
            <p className="text-xs text-indigo-600 mt-2">You will be the token admin with full control</p>
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
                : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isPending ? '⏳ Creating...' : isConfirming ? '⏳ Confirming...' : '🪙 Create Stablecoin'}
          </button>
        </form>
      ) : (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              {name} Created Successfully!
            </h3>
          </div>
          
          <div className="space-y-3 bg-white rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Token Name:</span>
              <span className="font-bold text-gray-800">{name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Symbol:</span>
              <span className="font-bold text-gray-800">{symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Currency:</span>
              <span className="font-bold text-gray-800">{currency}</span>
            </div>
            <div className="border-t pt-3">
              <span className="text-sm text-gray-600 block mb-2">Contract Address:</span>
              <code className="block bg-gray-100 p-3 rounded-lg text-xs font-mono break-all text-gray-800">
                {createdToken}
              </code>
            </div>
          </div>

          {receipt && (
            <a
              href={`https://explore.tempo.xyz/tx/${receipt.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center text-green-700 hover:text-green-800 font-medium text-sm underline"
            >
              📝 View on Explorer
            </a>
          )}

          <button
            onClick={() => {
              setCreatedToken('')
              setName('')
              setSymbol('')
              setCurrency('USD')
            }}
            className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
          >
            Create Another Token
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-gray-700">
            <p className="font-bold mb-2 text-blue-800">About TIP-20 Tokens:</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Built-in compliance and role-based access control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Can be used to pay transaction fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Fully compatible with ERC-20 standard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>You become the admin with full control</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
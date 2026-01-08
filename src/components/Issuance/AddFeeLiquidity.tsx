import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { TOKENS } from '../../constants/tokens'
import TokenSelectorForIssuance from './TokenSelectorForIssuance'

// FeeManager Precompiled Contract
const FEE_MANAGER = '0xfeec000000000000000000000000000000000000'

// FeeManager ABI
const feeManagerAbi = [
  {
    inputs: [
      { name: 'userToken', type: 'address' },
      { name: 'validatorToken', type: 'address' },
      { name: 'amountValidatorToken', type: 'uint128' },
      { name: 'to', type: 'address' },
    ],
    name: 'mint',
    outputs: [{ name: 'liquidity', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'userToken', type: 'address' },
      { name: 'validatorToken', type: 'address' },
    ],
    name: 'getPool',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'reserveUserToken', type: 'uint128' },
          { name: 'reserveValidatorToken', type: 'uint128' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ERC20 ABI for approve
const erc20Abi = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

interface AddFeeLiquidityProps {
  prefilledToken?: string
}

export default function AddFeeLiquidity({ prefilledToken }: AddFeeLiquidityProps) {
  const { address } = useAccount()
  const [userToken, setUserToken] = useState(prefilledToken || '')
  const [validatorToken, setValidatorToken] = useState<string>(TOKENS.AlphaUSD)
  const [amount, setAmount] = useState('')

  // Read pool info
  const { data: pool, refetch: refetchPool } = useReadContract({
    address: FEE_MANAGER,
    abi: feeManagerAbi,
    functionName: 'getPool',
    args: userToken && validatorToken ? [userToken as `0x${string}`, validatorToken as `0x${string}`] : undefined,
    query: {
      enabled: !!userToken && !!validatorToken,
    },
  })

  // Approve validator token
  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Add liquidity
  const { writeContract: addLiquidity, data: mintHash, isPending: isMinting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  const handleApprove = async () => {
    if (!address || !amount) {
      alert('Please fill amount and connect wallet')
      return
    }

    try {
      const amountInWei = parseUnits(amount, 6)
      
      await approve({
        address: validatorToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [FEE_MANAGER as `0x${string}`, amountInWei],
      })
    } catch (err: any) {
      console.error('Approve error:', err)
    }
  }

  const handleAddLiquidity = async () => {
    if (!address || !userToken || !amount) {
      alert('Please fill all fields and connect wallet')
      return
    }

    try {
      const amountInWei = parseUnits(amount, 6)

      await addLiquidity({
        address: FEE_MANAGER as `0x${string}`,
        abi: feeManagerAbi,
        functionName: 'mint',
        args: [
          userToken as `0x${string}`,
          validatorToken as `0x${string}`,
          amountInWei,
          address as `0x${string}`,
        ],
      })
    } catch (err: any) {
      console.error('Add liquidity error:', err)
    }
  }

  // Refetch pool after success
  if (isMintSuccess) {
    refetchPool()
  }

  const reserveUser = pool ? formatUnits(pool.reserveUserToken, 6) : '0'
  const reserveValidator = pool ? formatUnits(pool.reserveValidatorToken, 6) : '0'
  const hasLiquidity = pool && pool.reserveValidatorToken > 0n

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border-2 border-cyan-200">
        <h3 className="font-bold text-cyan-800 text-lg mb-2">💧 Add Fee Pool Liquidity</h3>
        <p className="text-sm text-cyan-700">
          Add AlphaUSD liquidity so users can pay gas fees with your token.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="text-sm text-yellow-800">
            <p className="font-bold mb-2">How it works:</p>
            <ul className="space-y-1 text-xs">
              <li>• Users pay gas fees with your token</li>
              <li>• Fee AMM swaps it to AlphaUSD for validators</li>
              <li>• You need AlphaUSD liquidity in the pool</li>
              <li>• Recommended: Start with 100+ AlphaUSD</li>
            </ul>
          </div>
        </div>
      </div>

      {isMintSuccess ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Liquidity Added Successfully!
            </h3>
            <p className="text-sm text-green-700">
              Users can now pay gas fees with your token
            </p>
          </div>

          <button
            onClick={() => {
              setAmount('')
              refetchPool()
            }}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
          >
            Add More Liquidity
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* User Token - Now with Selector */}
          <TokenSelectorForIssuance
            value={userToken}
            onChange={setUserToken}
            label="Your Token (User Token)"
          />
          {prefilledToken && userToken === prefilledToken && (
            <p className="text-xs text-gray-500 -mt-2">✅ Token address auto-filled from creation</p>
          )}

          {/* Validator Token Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Validator Token (Liquidity Token)
            </label>
            <select
              value={validatorToken}
              onChange={(e) => setValidatorToken(e.target.value)}
              className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all"
            >
              <option value={TOKENS.AlphaUSD}>AlphaUSD (Required on Testnet)</option>
              <option value={TOKENS.BetaUSD}>BetaUSD</option>
              <option value={TOKENS.ThetaUSD}>ThetaUSD</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              All testnet validators expect AlphaUSD
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Amount (Validator Token)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="0"
              step="0.000001"
              className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              Recommended minimum: 100 AlphaUSD
            </p>
          </div>

          {/* Pool Info */}
          {pool && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
              <p className="text-sm font-bold text-indigo-800 mb-3">📊 Current Pool Status:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">User Token Reserve:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {reserveUser} tokens
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Validator Token Reserve:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {reserveValidator} AlphaUSD
                  </span>
                </div>
                <div className="pt-2 border-t border-indigo-200">
                  <p className="text-xs text-indigo-600">
                    {!hasLiquidity
                      ? '⚠️ Pool empty - add liquidity to enable fee payments'
                      : '✅ Pool has liquidity - users can pay fees with your token'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          {!isApproveSuccess ? (
            <button
              onClick={handleApprove}
              disabled={isApproving || !address || !amount}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                isApproving || !address || !amount
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isApproving ? '⏳ Approving...' : '1️⃣ Approve AlphaUSD'}
            </button>
          ) : (
            <button
              onClick={handleAddLiquidity}
              disabled={isMinting || isConfirming || !address || !userToken || !amount}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                isMinting || isConfirming || !address || !userToken || !amount
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isMinting || isConfirming ? '⏳ Adding Liquidity...' : '2️⃣ Add Liquidity to Fee Pool'}
            </button>
          )}
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="text-2xl">🔧</div>
          <div className="text-sm text-gray-700">
            <p className="font-bold mb-2 text-gray-800">Technical Details:</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-gray-600">•</span>
                <span>Contract: FeeManager (0xfeec...0000)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600">•</span>
                <span>Fee swap rate: 0.9970 (user pays 1.003x)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600">•</span>
                <span>Rebalance rate: 0.9985 (arbitrageurs can rebalance)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-600">•</span>
                <span>You receive LP tokens representing your share</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
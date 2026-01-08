import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toHex } from 'viem'
import TokenSelectorForIssuance from './TokenSelectorForIssuance'

// TIP-20 Token ABI for role management
const tokenAbi = [
  {
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Role hashes
const ROLES = {
  ISSUER_ROLE: keccak256(toHex('ISSUER_ROLE')),
  BURNER_ROLE: keccak256(toHex('BURNER_ROLE')),
  PAUSER_ROLE: keccak256(toHex('PAUSER_ROLE')),
  COMPLIANCE_ROLE: keccak256(toHex('COMPLIANCE_ROLE')),
}

const ROLE_DESCRIPTIONS = {
  [ROLES.ISSUER_ROLE]: {
    name: 'ISSUER_ROLE',
    description: 'Can mint new tokens to any address, increasing total supply.',
  },
  [ROLES.BURNER_ROLE]: {
    name: 'BURNER_ROLE',
    description: 'Can burn tokens from any address, decreasing total supply.',
  },
  [ROLES.PAUSER_ROLE]: {
    name: 'PAUSER_ROLE',
    description: 'Can pause/unpause token transfers in emergency situations.',
  },
  [ROLES.COMPLIANCE_ROLE]: {
    name: 'COMPLIANCE_ROLE',
    description: 'Can manage compliance rules and blacklist addresses.',
  },
}

export default function GrantRole() {
  const { address } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>(ROLES.ISSUER_ROLE)
  const [granteeAddress, setGranteeAddress] = useState('')
  const [useMyAddress, setUseMyAddress] = useState(false)

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash,
  })

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault()

    const targetAddress = useMyAddress ? address : granteeAddress

    if (!tokenAddress || !selectedRole || !targetAddress) {
      alert('Please fill all fields')
      return
    }

    try {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: 'grantRole',
        args: [selectedRole as `0x${string}`, targetAddress as `0x${string}`],
      })
    } catch (err: any) {
      console.error('Grant role error:', err)
    }
  }

  const currentRoleInfo = ROLE_DESCRIPTIONS[selectedRole as keyof typeof ROLE_DESCRIPTIONS]

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
        <h3 className="font-bold text-purple-800 text-lg mb-2">👤 Grant Roles</h3>
        <p className="text-sm text-purple-700">
          Assign roles to addresses to control access to token functions.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Role Granted Successfully!
            </h3>
            <p className="text-sm text-green-700">
              {currentRoleInfo?.name} has been granted
            </p>
          </div>

          <button
            onClick={() => {
              setGranteeAddress('')
              setUseMyAddress(false)
            }}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
          >
            Grant Another Role
          </button>
        </div>
      ) : (
        <form onSubmit={handleGrantRole} className="space-y-4">
          {/* Token Address - Now with Selector */}
          <TokenSelectorForIssuance
            value={tokenAddress}
            onChange={setTokenAddress}
            label="Token Contract Address"
            placeholder="0x..."
          />

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Select Role to Grant
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value={ROLES.ISSUER_ROLE}>ISSUER_ROLE - Can mint tokens</option>
              <option value={ROLES.BURNER_ROLE}>BURNER_ROLE - Can burn tokens</option>
              <option value={ROLES.PAUSER_ROLE}>PAUSER_ROLE - Can pause transfers</option>
              <option value={ROLES.COMPLIANCE_ROLE}>COMPLIANCE_ROLE - Manage compliance</option>
            </select>
          </div>

          {/* Role Description */}
          {currentRoleInfo && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
              <div className="flex gap-3">
                <div className="text-2xl">ℹ️</div>
                <div>
                  <p className="text-sm font-bold text-yellow-800 mb-1">
                    {currentRoleInfo.name}
                  </p>
                  <p className="text-xs text-yellow-700">
                    {currentRoleInfo.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grantee Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Address to Grant Role
            </label>
            <input
              type="text"
              value={useMyAddress ? (address || '') : granteeAddress}
              onChange={(e) => setGranteeAddress(e.target.value)}
              placeholder="0x..."
              disabled={useMyAddress}
              required={!useMyAddress}
              className={`w-full border-2 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-4 transition-all ${
                useMyAddress
                  ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 focus:border-green-400 focus:ring-green-100'
              }`}
            />
          </div>

          {/* Use My Address Checkbox */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
            <input
              type="checkbox"
              id="useMyAddress"
              checked={useMyAddress}
              onChange={(e) => setUseMyAddress(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-indigo-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200"
            />
            <label htmlFor="useMyAddress" className="text-sm text-indigo-800 font-medium cursor-pointer">
              Use my address ({address?.slice(0, 6)}...{address?.slice(-4)})
            </label>
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
            disabled={isPending || isConfirming || !address || !tokenAddress}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              isPending || isConfirming || !address || !tokenAddress
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isPending ? '⏳ Granting...' : isConfirming ? '⏳ Confirming...' : '👤 Grant Role'}
          </button>
        </form>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-gray-700">
            <p className="font-bold mb-2 text-blue-800">About Roles:</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Only token admin can grant roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Roles are cumulative - one address can have multiple roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Be careful when granting roles - they give significant control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Roles can be revoked later by the admin</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
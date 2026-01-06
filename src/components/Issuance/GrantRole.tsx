import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toHex } from 'viem'

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

// Role constants
const ROLES = {
  ISSUER_ROLE: keccak256(toHex('ISSUER_ROLE')),
  BURNER_ROLE: keccak256(toHex('BURNER_ROLE')),
  PAUSER_ROLE: keccak256(toHex('PAUSER_ROLE')),
  COMPLIANCE_ROLE: keccak256(toHex('COMPLIANCE_ROLE')),
}

export default function GrantRole() {
  const { address } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [granteeAddress, setGranteeAddress] = useState('')
  const [selectedRole, setSelectedRole] = useState<keyof typeof ROLES>('ISSUER_ROLE')

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

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tokenAddress || !granteeAddress) {
      alert('Please fill all fields')
      return
    }

    try {
      const roleHash = ROLES[selectedRole]
      
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: 'grantRole',
        args: [roleHash, granteeAddress as `0x${string}`],
      })
    } catch (err: any) {
      console.error('Grant role error:', err)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-2xl font-bold text-purple-800 mb-2">
          Role Granted Successfully!
        </h3>
        <p className="text-purple-700 mb-4">
          {selectedRole} has been granted to {granteeAddress.slice(0, 6)}...{granteeAddress.slice(-4)}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
        >
          Grant Another Role
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
        <h3 className="font-bold text-purple-800 text-lg mb-2">👤 Grant Roles</h3>
        <p className="text-sm text-purple-700">
          Assign roles to addresses to control access to token functions.
        </p>
      </div>

      <form onSubmit={handleGrantRole} className="space-y-4">
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

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Select Role to Grant
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as keyof typeof ROLES)}
            className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
          >
            <option value="ISSUER_ROLE">ISSUER_ROLE - Can mint tokens</option>
            <option value="BURNER_ROLE">BURNER_ROLE - Can burn tokens</option>
            <option value="PAUSER_ROLE">PAUSER_ROLE - Can pause transfers</option>
            <option value="COMPLIANCE_ROLE">COMPLIANCE_ROLE - Can manage compliance</option>
          </select>
        </div>

        {/* Grantee Address */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Address to Grant Role
          </label>
          <input
            type="text"
            value={granteeAddress}
            onChange={(e) => setGranteeAddress(e.target.value)}
            placeholder="0x..."
            required
            className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-5 py-4 font-mono text-sm focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all"
          />
          <button
            type="button"
            onClick={() => address && setGranteeAddress(address)}
            className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Use my address
          </button>
        </div>

        {/* Role Description */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
          <h4 className="font-bold text-yellow-800 mb-2">
            {selectedRole === 'ISSUER_ROLE' && '➕ Issuer Role'}
            {selectedRole === 'BURNER_ROLE' && '🔥 Burner Role'}
            {selectedRole === 'PAUSER_ROLE' && '⏸️ Pauser Role'}
            {selectedRole === 'COMPLIANCE_ROLE' && '📋 Compliance Role'}
          </h4>
          <p className="text-sm text-yellow-700">
            {selectedRole === 'ISSUER_ROLE' && 'Can mint new tokens to any address, increasing total supply.'}
            {selectedRole === 'BURNER_ROLE' && 'Can burn tokens from their own balance, decreasing total supply.'}
            {selectedRole === 'PAUSER_ROLE' && 'Can pause all token transfers in emergency situations.'}
            {selectedRole === 'COMPLIANCE_ROLE' && 'Can manage compliance rules and whitelist addresses.'}
          </p>
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
              : 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isPending ? '⏳ Granting...' : isConfirming ? '⏳ Confirming...' : '👤 Grant Role'}
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-gray-700">
            <p className="font-bold mb-2 text-blue-800">About Roles:</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>You must have DEFAULT_ADMIN_ROLE to grant roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Multiple addresses can have the same role</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Roles can be revoked later if needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Best practice: separate roles for security</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
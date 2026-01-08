import { useState } from 'react'
import CreateStablecoin from './CreateStablecoin'
import MintTokens from './MintTokens'
import BurnTokens from './BurnTokens'
import GrantRole from './GrantRole'
import AddFeeLiquidity from './AddFeeLiquidity'

type IssuanceTab = 'create' | 'grant' | 'mint' | 'burn' | 'feepool'

export default function IssuanceInterface() {
  const [activeTab, setActiveTab] = useState<IssuanceTab>('create')
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string>('')

  // Callback when token is created successfully
  const handleTokenCreated = (tokenAddress: string) => {
    setCreatedTokenAddress(tokenAddress)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-2">
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🪙 Create
          </button>
          <button
            onClick={() => setActiveTab('grant')}
            className={`py-3 px-4 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'grant'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👤 Grant
          </button>
          <button
            onClick={() => setActiveTab('mint')}
            className={`py-3 px-4 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'mint'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ➕ Mint
          </button>
          <button
            onClick={() => setActiveTab('burn')}
            className={`py-3 px-4 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'burn'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔥 Burn
          </button>
          <button
            onClick={() => setActiveTab('feepool')}
            className={`py-3 px-4 rounded-xl font-semibold transition-all text-sm ${
              activeTab === 'feepool'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💧 Fee Pool
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === 'create' && (
          <CreateStablecoin onTokenCreated={handleTokenCreated} />
        )}
        {activeTab === 'grant' && <GrantRole />}
        {activeTab === 'mint' && <MintTokens />}
        {activeTab === 'burn' && <BurnTokens />}
        {activeTab === 'feepool' && (
          <AddFeeLiquidity prefilledToken={createdTokenAddress} />
        )}
      </div>

      {/* Quick Actions */}
      {createdTokenAddress && activeTab !== 'feepool' && (
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-cyan-800 mb-1">
                ⚡ Quick Action Available
              </p>
              <p className="text-xs text-cyan-700">
                Add fee pool liquidity for your newly created token
              </p>
            </div>
            <button
              onClick={() => setActiveTab('feepool')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              💧 Add Liquidity
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
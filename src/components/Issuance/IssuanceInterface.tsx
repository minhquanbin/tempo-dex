import { useState } from 'react'
import { useAccount } from 'wagmi'
import CreateStablecoin from './CreateStablecoin'
import MintTokens from './MintTokens'
import BurnTokens from './BurnTokens'
import GrantRole from './GrantRole'

type IssuanceTab = 'create' | 'grant' | 'mint' | 'burn'

export default function IssuanceInterface() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<IssuanceTab>('create')

  const tabs = [
    { id: 'create' as IssuanceTab, name: 'Create Token', icon: '🪙' },
    { id: 'grant' as IssuanceTab, name: 'Grant Role', icon: '👤' },
    { id: 'mint' as IssuanceTab, name: 'Mint', icon: '➕' },
    { id: 'burn' as IssuanceTab, name: 'Burn', icon: '🔥' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
      {!isConnected ? (
        <div className="text-center py-20 px-4">
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">🪙</div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Issue Stablecoins</h3>
          <p className="text-gray-500 mb-6">Connect your wallet to create and manage stablecoins</p>
          <div className="inline-block px-6 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
            Connect wallet above ↗️
          </div>
        </div>
      ) : (
        <div>
          {/* Sub Tabs */}
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  <div className="text-xl mb-1">{tab.icon}</div>
                  <div>{tab.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="animate-fadeIn">
            {activeTab === 'create' && <CreateStablecoin />}
            {activeTab === 'grant' && <GrantRole />}
            {activeTab === 'mint' && <MintTokens />}
            {activeTab === 'burn' && <BurnTokens />}
          </div>
        </div>
      )}
    </div>
  )
}
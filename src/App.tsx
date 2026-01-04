import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../wagmi.config'
import WalletConnect from './components/Common/WalletConnect'
import SwapInterface from './components/Swap/SwapInterface'
import AddLiquidity from './components/Liquidity/AddLiquidity'
import { useState } from 'react'

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap')

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-center text-indigo-900 mb-2">
                🚀 Tempo DEX
              </h1>
              <p className="text-center text-gray-600">
                Swap stablecoins on Tempo Network
              </p>
            </header>

            {/* Wallet Connect */}
            <div className="flex justify-end mb-6">
              <WalletConnect />
            </div>

            {/* Tabs */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('swap')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                    activeTab === 'swap'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🔄 Swap
                </button>
                <button
                  onClick={() => setActiveTab('liquidity')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                    activeTab === 'liquidity'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  💧 Liquidity
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto">
              {activeTab === 'swap' ? <SwapInterface /> : <AddLiquidity />}
            </div>

            {/* Footer */}
            <footer className="mt-12 text-center text-gray-500 text-sm">
              <p>Powered by Tempo Network | Testnet</p>
              <p className="mt-2">
                <a 
                  href="https://docs.tempo.xyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  📚 Documentation
                </a>
              </p>
            </footer>
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
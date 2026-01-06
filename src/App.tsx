import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import ConnectWallet from './components/Wallet/ConnectWallet'
import SwapInterface from './components/Swap/SwapInterface'
import AddLiquidity from './components/Liquidity/AddLiquidity'
import PaymentInterface from './components/Payment/PaymentInterface'
import IssuanceInterface from './components/Issuance/IssuanceInterface'

const queryClient = new QueryClient()

function App() {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'payment' | 'issuance'>('swap')

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">💱</div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Tempo DEX
                    </h1>
                    <p className="text-xs text-gray-500">Swap & Pay on Tempo Network</p>
                  </div>
                </div>
                <ConnectWallet />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-2xl mx-auto px-4 py-8">
            {/* Tab Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveTab('swap')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    activeTab === 'swap'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🔄 Swap
                </button>
                <button
                  onClick={() => setActiveTab('liquidity')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    activeTab === 'liquidity'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  💧 Liquidity
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    activeTab === 'payment'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  💸 Payment
                </button>
                <button
                  onClick={() => setActiveTab('issuance')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    activeTab === 'issuance'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🪙 Issuance
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="animate-fadeIn">
              {activeTab === 'swap' && <SwapInterface />}
              {activeTab === 'liquidity' && <AddLiquidity />}
              {activeTab === 'payment' && <PaymentInterface />}
              {activeTab === 'issuance' && <IssuanceInterface />}
            </div>

            {/* Footer Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-2">
                Powered by Tempo Network | Testnet
              </p>
              <a
                href="https://docs.tempo.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 underline"
              >
                📚 Documentation
              </a>
            </div>
          </main>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
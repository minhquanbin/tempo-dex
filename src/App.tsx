import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../wagmi.config'
import WalletConnect from './components/Common/WalletConnect'
import EnhancedSwapInterface from './components/Swap/EnhancedSwapInterface'
import AddLiquidity from './components/Liquidity/AddLiquidity'
import PaymentInterface from './components/Payment/PaymentInterface'
import { useState } from 'react'
import { ArrowLeftRight, Droplets, Send, Sparkles } from 'lucide-react'

const queryClient = new QueryClient()

type TabType = 'swap' | 'liquidity' | 'payment'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('swap')

  const tabs = [
    { id: 'swap' as TabType, name: 'Swap', icon: ArrowLeftRight, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'liquidity' as TabType, name: 'Liquidity', icon: Droplets, gradient: 'from-purple-500 to-pink-500' },
    { id: 'payment' as TabType, name: 'Payment', icon: Send, gradient: 'from-green-500 to-emerald-500' },
  ]

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-50">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 py-8">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-2xl blur-lg opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-purple-600 to-cyan-500 p-3 rounded-2xl">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Tempo DEX
                    </h1>
                    <p className="text-gray-400 text-sm">Next-gen stablecoin exchange</p>
                  </div>
                </div>
                <WalletConnect />
              </div>
            </header>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
                <div className="grid grid-cols-3 gap-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative group px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl transition-all duration-300`}></div>
                        )}
                        <div className="relative flex items-center justify-center gap-2">
                          <Icon className="w-5 h-5" />
                          <span>{tab.name}</span>
                        </div>
                        {!isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur-2xl opacity-20"></div>
                
                {/* Content Card */}
                <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10">
                  {activeTab === 'swap' && <EnhancedSwapInterface />}
                  {activeTab === 'liquidity' && <AddLiquidity />}
                  {activeTab === 'payment' && <PaymentInterface />}
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-black/20 backdrop-blur-xl rounded-full border border-white/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Tempo Testnet</span>
              </div>
              <p className="mt-4 text-gray-500 text-sm">
                <a 
                  href="https://docs.tempo.xyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  📚 Documentation
                </a>
              </p>
            </footer>
          </div>
        </div>

        {/* CSS for animations */}
        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    connect({ connector: injected() })
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-md">
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500">Connected</span>
          <span className="font-mono text-sm font-semibold text-indigo-600">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-105"
    >
      🔗 Connect Wallet
    </button>
  )
}
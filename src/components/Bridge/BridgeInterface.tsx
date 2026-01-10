import { useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { BRIDGE_TOKENS, CCIPFeeOption } from '../../constants/ccip'
import ChainSelector from './ChainSelector'
import BridgeQuote from './BridgeQuote'
import useBridge from '../../hooks/useBridge'
import { parseTokenAmount } from '../../utils/formatting'
import TokenBalance from '../Common/TokenBalance'

const AVAILABLE_CHAINS = [
  { id: 42431, name: 'Tempo Testnet', icon: '⚡' },
  { id: 11155111, name: 'Sepolia', icon: '🔷' },
]

export default function BridgeInterface() {
  const { isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  
  const [sourceChain, setSourceChain] = useState<42431 | 11155111>(42431) // Tempo
  const [destinationChain, setDestinationChain] = useState<42431 | 11155111>(11155111) // Sepolia
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [feeOption] = useState<CCIPFeeOption>(CCIPFeeOption.NATIVE)

  // Get token for current source chain (CCIP-BnM is the only token available on both chains)
  const selectedToken = BRIDGE_TOKENS['CCIP-BnM']
  const tokenAddress = selectedToken.addresses[sourceChain] || ''

  const {
    estimatedFee,
    isLoadingFee,
    executeBridge,
    isBridging,
    needsApproval,
    isApproveSuccess,
    isBridgeSuccess,
    error,
    isWrongChain,
  } = useBridge({
    sourceChainId: sourceChain,
    destinationChainId: destinationChain,
    tokenAddress,
    amount: amount ? parseTokenAmount(amount) : 0n,
    recipientAddress: recipientAddress || undefined,
    feeOption,
  })

  const handleBridge = async () => {
    if (!amount || !estimatedFee) return
    await executeBridge()
    
    if (isBridgeSuccess) {
      setAmount('')
      setRecipientAddress('')
    }
  }

  const handleFlipChains = () => {
    const newSource = destinationChain
    const newDest = sourceChain
    setSourceChain(newSource)
    setDestinationChain(newDest)
    setAmount('')
  }

  const handleSwitchNetwork = async () => {
    if (switchChainAsync) {
      try {
        await switchChainAsync({ chainId: sourceChain })
      } catch (error) {
        console.error('Failed to switch network:', error)
      }
    }
  }

  const getButtonText = () => {
    if (isWrongChain) return '🔄 Switch Network'
    if (isLoadingFee) return '⏳ Calculating Fee...'
    if (isBridging) {
      if (needsApproval && !isApproveSuccess) return '⏳ Approving...'
      return '🌉 Bridging...'
    }
    if (needsApproval) return '✅ Approve Token'
    return '🚀 Bridge Tokens'
  }

  const isButtonDisabled = !amount || !estimatedFee || (isBridging && !isWrongChain) || isLoadingFee

  const sourceChainInfo = AVAILABLE_CHAINS.find(c => c.id === sourceChain)
  const destChainInfo = AVAILABLE_CHAINS.find(c => c.id === destinationChain)

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
      {!isConnected ? (
        <div className="text-center py-20 px-4">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">🌉</div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Bridge Tokens</h3>
          <p className="text-gray-500 mb-6">Connect your wallet to bridge tokens across chains</p>
          <div className="inline-block px-6 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
            Connect wallet above ↗️
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🌉</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Cross-Chain Bridge</h3>
              <p className="text-sm text-gray-500">Powered by Chainlink CCIP</p>
            </div>
          </div>

          {/* Source Chain */}
          <ChainSelector
            selected={sourceChain}
            options={AVAILABLE_CHAINS.filter(c => c.id !== destinationChain)}
            onChange={(chainId) => setSourceChain(chainId as 42431 | 11155111)}
            label="From Chain"
          />

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-600">Amount</label>
              {tokenAddress && <TokenBalance token={tokenAddress} />}
            </div>
            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-3xl font-bold focus:outline-none text-gray-800 placeholder-gray-400"
                  step="0.01"
                />
                <div className="bg-white border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="font-bold text-gray-800">{selectedToken.symbol}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleFlipChains}
              className="bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:rotate-180 duration-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          {/* Destination Chain */}
          <ChainSelector
            selected={destinationChain}
            options={AVAILABLE_CHAINS.filter(c => c.id !== sourceChain)}
            onChange={(chainId) => setDestinationChain(chainId as 42431 | 11155111)}
            label="To Chain"
          />

          {/* Recipient Address (Optional) */}
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              Recipient Address (Optional)
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Leave empty to send to your address"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-400 text-gray-800 placeholder-gray-400 font-mono text-sm"
            />
          </div>

          {/* Bridge Quote */}
          {estimatedFee && amount && sourceChainInfo && destChainInfo && (
            <BridgeQuote
              amount={parseTokenAmount(amount)}
              fee={estimatedFee}
              tokenSymbol={selectedToken.symbol}
              sourceChain={sourceChainInfo.name}
              destinationChain={destChainInfo.name}
            />
          )}

          {/* Approval Success */}
          {isApproveSuccess && needsApproval && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <p className="text-green-800 font-semibold">Token Approved!</p>
                <p className="text-green-600 text-sm">Click the button below to complete the bridge</p>
              </div>
            </div>
          )}

          {/* Wrong Network Warning */}
          {isWrongChain && chainId && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <p className="text-yellow-800 font-semibold">Wrong Network</p>
                <p className="text-yellow-700 text-sm">
                  Please switch to {sourceChainInfo?.name} to continue
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
              <div className="text-2xl">❌</div>
              <p className="text-red-700 text-sm flex-1">{error}</p>
            </div>
          )}

          {/* Bridge Button */}
          <button
            onClick={isWrongChain ? handleSwitchNetwork : handleBridge}
            disabled={isButtonDisabled && !isWrongChain}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              isButtonDisabled && !isWrongChain
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isWrongChain
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-2xl hover:scale-[1.02]'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {getButtonText()}
          </button>

          {/* Info */}
          {needsApproval && amount && estimatedFee && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">Two-step process:</p>
                <p>First approve the token for CCIP Router, then click bridge to complete the transfer.</p>
              </div>
            </div>
          )}

          {/* CCIP Info */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-lg">🔗</div>
              <p className="font-semibold text-gray-800 text-sm">About Chainlink CCIP</p>
            </div>
            <p className="text-xs text-gray-600">
              CCIP (Cross-Chain Interoperability Protocol) is a secure messaging protocol that enables safe cross-chain token transfers and data exchange. All bridges are verified by Chainlink's decentralized oracle network.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
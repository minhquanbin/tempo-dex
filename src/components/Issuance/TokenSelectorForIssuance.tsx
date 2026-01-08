import { useState, useEffect } from 'react'
import { isAddress } from 'viem'

interface SavedToken {
  address: string
  name: string
  symbol: string
  createdAt: number
}

interface TokenSelectorForIssuanceProps {
  value: string
  onChange: (address: string) => void
  label?: string
}

const STORAGE_KEY = 'tempo-dex-created-tokens'

// Helper functions for localStorage
export const saveCreatedToken = (token: { address: string; name: string; symbol: string }) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const tokens: SavedToken[] = stored ? JSON.parse(stored) : []
    
    // Check if token already exists
    const exists = tokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())
    if (!exists) {
      tokens.push({
        ...token,
        createdAt: Date.now()
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
    }
  } catch (error) {
    console.error('Error saving token:', error)
  }
}

const loadSavedTokens = (): SavedToken[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading tokens:', error)
    return []
  }
}

const deleteToken = (address: string) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const tokens: SavedToken[] = stored ? JSON.parse(stored) : []
    const filtered = tokens.filter(t => t.address.toLowerCase() !== address.toLowerCase())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting token:', error)
  }
}

export default function TokenSelectorForIssuance({ 
  value, 
  onChange, 
  label = "Token Contract Address"
}: TokenSelectorForIssuanceProps) {
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([])
  const [useCustom, setUseCustom] = useState(false)
  const [customAddress, setCustomAddress] = useState('')

  // Load saved tokens on mount
  useEffect(() => {
    const tokens = loadSavedTokens()
    setSavedTokens(tokens)
    
    // If value exists but not in saved tokens, enable custom input
    if (value && !tokens.some(t => t.address.toLowerCase() === value.toLowerCase())) {
      setUseCustom(true)
      setCustomAddress(value)
    }
  }, [value])

  // Refresh tokens periodically (when new token created)
  useEffect(() => {
    const interval = setInterval(() => {
      const tokens = loadSavedTokens()
      setSavedTokens(tokens)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleSelectToken = (address: string) => {
    onChange(address)
    setUseCustom(false)
    setCustomAddress('')
  }

  const handleCustomAddressChange = (address: string) => {
    setCustomAddress(address)
    if (isAddress(address)) {
      onChange(address)
    }
  }

  const handleDeleteToken = (address: string) => {
    deleteToken(address)
    setSavedTokens(prev => prev.filter(t => t.address.toLowerCase() !== address.toLowerCase()))
    if (value.toLowerCase() === address.toLowerCase()) {
      onChange('')
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        {label}
      </label>

      {/* Saved Tokens List */}
      {savedTokens.length > 0 && !useCustom && (
        <div className="space-y-2 mb-3">
          {savedTokens.map((token) => (
            <div
              key={token.address}
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                value.toLowerCase() === token.address.toLowerCase()
                  ? 'bg-purple-100 border-purple-400'
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleSelectToken(token.address)}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-800">
                  {token.name} ({token.symbol})
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  {token.address.slice(0, 10)}...{token.address.slice(-8)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteToken(token.address)
                }}
                className="ml-2 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom Address Input */}
      {useCustom ? (
        <div className="space-y-2">
          <input
            type="text"
            value={customAddress}
            onChange={(e) => handleCustomAddressChange(e.target.value)}
            placeholder="0x..."
            className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl px-5 py-4 font-mono text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
          />
          {savedTokens.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setUseCustom(false)
                setCustomAddress('')
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to saved tokens
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setUseCustom(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all"
        >
          + Use custom address
        </button>
      )}

      {/* Validation Indicator */}
      {value && (
        <div className="mt-2 text-xs">
          {isAddress(value) ? (
            <span className="text-green-600">✓ Valid address</span>
          ) : (
            <span className="text-red-600">✗ Invalid address</span>
          )}
        </div>
      )}
    </div>
  )
}
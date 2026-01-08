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
  placeholder?: string
}

export default function TokenSelectorForIssuance({
  value,
  onChange,
  label = 'Token Contract Address',
  placeholder = '0x...',
}: TokenSelectorForIssuanceProps) {
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customAddress, setCustomAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Load saved tokens from storage
  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    try {
      setIsLoading(true)
      const result = await window.storage.get('created-tokens', false)
      
      if (result && result.value) {
        const tokens = JSON.parse(result.value) as SavedToken[]
        setSavedTokens(tokens)
      }
    } catch (error) {
      console.error('Failed to load tokens:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    
    if (selectedValue === 'custom') {
      setShowCustomInput(true)
      onChange('')
    } else {
      setShowCustomInput(false)
      onChange(selectedValue)
    }
  }

  const handleCustomAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const addr = e.target.value
    setCustomAddress(addr)
    
    if (isAddress(addr)) {
      onChange(addr)
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        {label}
      </label>

      {isLoading ? (
        <div className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-center text-gray-500">
          Loading tokens...
        </div>
      ) : (
        <>
          {savedTokens.length > 0 ? (
            <select
              value={showCustomInput ? 'custom' : value}
              onChange={handleSelectChange}
              className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl px-5 py-4 text-lg font-semibold focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
            >
              <option value="">Select a token...</option>
              {savedTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.name} ({token.symbol}) - {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </option>
              ))}
              <option value="custom">+ Use custom address</option>
            </select>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ No tokens found. Create a token first or enter address manually.
                </p>
              </div>
              <input
                type="text"
                value={customAddress}
                onChange={handleCustomAddressChange}
                placeholder={placeholder}
                className="w-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
              />
            </div>
          )}

          {showCustomInput && savedTokens.length > 0 && (
            <div className="mt-3">
              <input
                type="text"
                value={customAddress}
                onChange={handleCustomAddressChange}
                placeholder={placeholder}
                className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
          )}

          {value && isAddress(value) && (
            <div className="mt-2 text-xs text-gray-500">
              ✅ Valid address: {value.slice(0, 10)}...{value.slice(-8)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Helper function to save new token
export async function saveCreatedToken(
  address: string,
  name: string,
  symbol: string
): Promise<void> {
  try {
    // Load existing tokens
    const result = await window.storage.get('created-tokens', false)
    let tokens: SavedToken[] = []
    
    if (result && result.value) {
      tokens = JSON.parse(result.value)
    }

    // Check if token already exists
    const exists = tokens.some(t => t.address.toLowerCase() === address.toLowerCase())
    if (exists) {
      console.log('Token already saved')
      return
    }

    // Add new token
    const newToken: SavedToken = {
      address,
      name,
      symbol,
      createdAt: Date.now(),
    }

    tokens.unshift(newToken) // Add to beginning

    // Save back to storage
    await window.storage.set('created-tokens', JSON.stringify(tokens), false)
    
    console.log('Token saved successfully:', newToken)
  } catch (error) {
    console.error('Failed to save token:', error)
  }
}
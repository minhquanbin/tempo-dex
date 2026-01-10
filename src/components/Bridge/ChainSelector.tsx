import { useState } from 'react'

interface Chain {
  id: number
  name: string
  icon: string
}

interface ChainSelectorProps {
  selected: number
  options: Chain[]
  onChange: (chainId: number) => void
  label: string
}

function ChainSelector({ selected, options, onChange, label }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedChain = options.find(c => c.id === selected)

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-purple-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{selectedChain?.icon}</div>
            <span className="font-bold text-gray-800">{selectedChain?.name}</span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute top-full mt-2 left-0 right-0 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
              {options.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    onChange(chain.id)
                    setIsOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-3 ${
                    chain.id === selected ? 'bg-purple-100' : ''
                  }`}
                >
                  <div className="text-2xl">{chain.icon}</div>
                  <span className="font-semibold text-gray-800">{chain.name}</span>
                  {chain.id === selected && (
                    <span className="ml-auto text-purple-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ChainSelector
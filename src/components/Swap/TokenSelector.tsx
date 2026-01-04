import { useState } from 'react'
import { TOKEN_NAMES } from '../../constants/tokens'

interface TokenSelectorProps {
  selected: string
  options: string[]
  onChange: (token: string) => void
}

export default function TokenSelector({ selected, options, onChange }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center gap-2 hover:border-indigo-300 transition-all min-w-[140px]"
      >
        <span className="font-bold text-gray-800">
          {TOKEN_NAMES[selected as keyof typeof TOKEN_NAMES]}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full mt-2 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-20 min-w-[160px]">
            {options.map((token) => (
              <button
                key={token}
                onClick={() => {
                  onChange(token)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                <span className="font-semibold text-gray-800">
                  {TOKEN_NAMES[token as keyof typeof TOKEN_NAMES]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
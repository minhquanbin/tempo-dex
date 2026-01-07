{/* Currency Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency (ISO 4217)
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="USD"
                maxLength={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">3-letter currency code (e.g., USD, EUR, GBP)</p>
            </div>

            {/* Quote Token Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Token
              </label>
              <select
                value={quoteToken}
                onChange={(e) => setQuoteToken(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="0x20c0000000000000000000000000000000000000">pathUSD (Default)</option>
                <option value={TOKENS.AlphaUSD}>AlphaUSD</option>
                <option value={TOKENS.BetaUSD}>BetaUSD</option>
                <option value={TOKENS.ThetaUSD}>ThetaUSD</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Token used for price quotes</p>
            </div>// TIP-20 Token Factory ABI (CORRECT - with all parameters!)
const tokenFactoryAbi = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'currency', type: 'string' },
      { name: 'quoteToken', type: 'address' },
      { name: 'admin', type: 'address' },
    ],
    name: 'createToken',
    outputs: [{ name: 'token', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
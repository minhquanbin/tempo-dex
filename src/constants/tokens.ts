// Token addresses on Tempo Testnet
export const TOKENS = {
  AlphaUSD: '0x20c0000000000000000000000000000000000001',
  BetaUSD: '0x20c0000000000000000000000000000000000002',
  ThetaUSD: '0x20c0000000000000000000000000000000000003',
  pathUSD: '0x20c0000000000000000000000000000000000000',
} as const

export const TOKEN_NAMES = {
  [TOKENS.AlphaUSD]: 'AlphaUSD',
  [TOKENS.BetaUSD]: 'BetaUSD',
  [TOKENS.ThetaUSD]: 'ThetaUSD',
  [TOKENS.pathUSD]: 'pathUSD',
} as const

// ✅ CORRECT: Tempo DEX Precompiled Contract Address
// This is the enshrined Stablecoin Exchange precompile
export const DEX_CONTRACT = '0xdec0000000000000000000000000000000000000'

// Token decimals - All TIP-20 testnet tokens use 6 decimals (not 18!)
export const TOKEN_DECIMALS = 6
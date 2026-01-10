// Chainlink CCIP Configuration for Tempo <-> Sepolia Bridge
// ✅ Real addresses from Chainlink DevHub (verified Jan 2026)

export const CCIP_ROUTER_ADDRESSES = {
  // Tempo Testnet CCIP Router
  42431: '0xAE7D1b3D8466718378038de45D4D376E73A04EB6' as `0x${string}`,
  
  // Sepolia CCIP Router
  11155111: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59' as `0x${string}`,
} as const

// CCIP Chain Selectors (used by CCIP to identify chains)
export const CCIP_CHAIN_SELECTORS = {
  // Tempo Testnet selector
  42431: '3963528237232804922',
  
  // Sepolia selector
  11155111: '16015286601757825753',
} as const

// LINK Token addresses (needed to pay CCIP fees)
export const LINK_TOKEN_ADDRESSES = {
  // LINK on Tempo Testnet
  42431: '0x384C8843411f725e800E625d5d1B659256D629dF' as `0x${string}`,
  
  // LINK on Sepolia
  11155111: '0x779877A7B0D9E8603169DdbD7836e478b4624789' as `0x${string}`,
} as const

// Supported tokens for bridging
export interface BridgeToken {
  name: string
  symbol: string
  addresses: {
    [chainId: number]: string
  }
  decimals: number
  poolAddress?: {
    [chainId: number]: string
  }
}

export const BRIDGE_TOKENS: Record<string, BridgeToken> = {
  // CCIP-BnM - Chainlink official test token (RECOMMENDED for testing)
  'CCIP-BnM': {
    name: 'CCIP-BnM Test Token',
    symbol: 'CCIP-BnM',
    addresses: {
      42431: '0x9Af873f951c444d37B27B440ae53AB63CE58E5e5' as `0x${string}`, // CCIP-BnM on Tempo
      11155111: '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05' as `0x${string}`, // CCIP-BnM on Sepolia
    },
    decimals: 18,
    poolAddress: {
      42431: '0x8A9886bC69Bb735AC082C91286DC2f1bDf6d3411' as `0x${string}`, // Burn/Mint pool on Tempo
    }
  },
  
  // AlphaUSD - Tempo native stablecoin
  AlphaUSD: {
    name: 'Alpha USD',
    symbol: 'AlphaUSD',
    addresses: {
      42431: '0x20C0000000000000000000000000000000000001' as `0x${string}`, // AlphaUSD on Tempo
      // Note: Not available on Sepolia yet - needs to be bridged first
    },
    decimals: 6,
  },
  
  // BetaUSD - Tempo native stablecoin
  BetaUSD: {
    name: 'Beta USD',
    symbol: 'BetaUSD',
    addresses: {
      42431: '0x20C0000000000000000000000000000000000002' as `0x${string}`, // BetaUSD on Tempo
      // Note: Not available on Sepolia yet - needs to be bridged first
    },
    decimals: 6,
  },
  
  // ThetaUSD - Tempo native stablecoin
  ThetaUSD: {
    name: 'Theta USD',
    symbol: 'ThetaUSD',
    addresses: {
      42431: '0x20C0000000000000000000000000000000000003' as `0x${string}`, // ThetaUSD on Tempo
      // Note: Not available on Sepolia yet - needs to be bridged first
    },
    decimals: 6,
  },
}

// CCIP Fee payment options
export enum CCIPFeeOption {
  LINK = 'LINK', // Pay with LINK tokens
  NATIVE = 'NATIVE', // Pay with native gas token (TEMPO or ETH)
}

// Estimated bridge times (in seconds)
export const ESTIMATED_BRIDGE_TIME = {
  FAST: 120, // ~2 minutes
  NORMAL: 300, // ~5 minutes
  SLOW: 600, // ~10 minutes
}

// Gas limits for CCIP transactions
export const CCIP_GAS_LIMITS = {
  TRANSFER: 200000n, // Gas for receiving tokens on destination
  MESSAGE: 50000n, // Additional gas for message processing
}
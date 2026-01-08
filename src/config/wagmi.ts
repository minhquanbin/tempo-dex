import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'

// ============================================
// TEMPO TESTNET - OFFICIAL CONFIG
// Docs: https://docs.tempo.xyz/quickstart/connection-details
// ============================================

export const tempoTestnet = defineChain({
  id: 42429, // ✅ CORRECT Chain ID (confirmed in MetaMask)
  name: 'Tempo Testnet (Andantino)',
  nativeCurrency: {
    name: 'USD',
    symbol: 'USD',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.tempo.xyz'],
      webSocket: ['wss://rpc.testnet.tempo.xyz'],
    },
    public: {
      http: ['https://rpc.testnet.tempo.xyz'],
      webSocket: ['wss://rpc.testnet.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explore.tempo.xyz', // ✅ No "testnet" subdomain
    },
  },
  testnet: true,
})

// ============================================
// WAGMI CONFIG
// ============================================

export const config = createConfig({
  chains: [tempoTestnet],
  transports: {
    [tempoTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
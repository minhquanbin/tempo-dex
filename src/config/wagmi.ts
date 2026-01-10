import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { sepolia } from 'wagmi/chains'

// Tempo Moderato Testnet (NEW - March 2025)
export const tempoTestnet = defineChain({
  id: 42431, // Updated: Moderato testnet
  name: 'Tempo Moderato Testnet',
  nativeCurrency: {
    name: 'Tempo',
    symbol: 'TEMPO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.moderato.tempo.xyz'], // Updated RPC
    },
    public: {
      http: ['https://rpc.moderato.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explore.tempo.xyz', // Same explorer for both
    },
  },
  testnet: true,
})

// Create Wagmi config with both chains
export const config = createConfig({
  chains: [tempoTestnet, sepolia],
  transports: {
    [tempoTestnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
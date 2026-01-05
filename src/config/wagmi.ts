import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'

// Định nghĩa Tempo Testnet chain
export const tempoTestnet = defineChain({
  id: 41144114, // Tempo Testnet Chain ID
  name: 'Tempo Testnet',
  nativeCurrency: {
    name: 'Tempo',
    symbol: 'TEMPO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.tempo.xyz'],
    },
    public: {
      http: ['https://rpc.testnet.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explore.testnet.tempo.xyz',
    },
  },
  testnet: true,
})

// Tạo Wagmi config
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
import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Tempo Testnet Chain Configuration
export const tempoTestnet = {
  id: 41144114, // Tempo Testnet chain ID
  name: 'Tempo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TEMPO',
    symbol: 'TEMPO',
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
      url: 'https://testnet.temposcan.io',
    },
  },
  testnet: true,
} as const

// Wagmi Config
export const config = createConfig({
  chains: [tempoTestnet],
  connectors: [
    injected({ 
      target: 'metaMask',
    }),
  ],
  transports: {
    [tempoTestnet.id]: http(),
  },
})
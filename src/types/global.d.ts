// Global type declarations for Ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string
        params?: unknown[]
      }) => Promise<unknown>
      on?: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

// Type declarations for CSS imports
declare module '*.css' {
  const content: Record<string, string>
  export default content
}

export {}
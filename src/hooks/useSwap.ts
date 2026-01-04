import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { DEX_CONTRACT } from '../constants/tokens'
import { calculateMaxAmountIn } from '../utils/slippage'

interface UseSwapProps {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  slippage: number
}

// DEX ABI - simplified for swap operations
const dexAbi = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    name: 'getQuote',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
    ],
    name: 'swap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// ERC20 ABI for approve
const erc20Abi = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export default function useSwap({ tokenIn, tokenOut, amountIn, slippage }: UseSwapProps) {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)

  // Get quote from DEX
  const { data: quote, isLoading: isLoadingQuote, error: quoteError } = useReadContract({
    address: DEX_CONTRACT as `0x${string}`,
    abi: dexAbi,
    functionName: 'getQuote',
    args: amountIn > 0n ? [tokenIn as `0x${string}`, tokenOut as `0x${string}`, amountIn] : undefined,
    query: {
      enabled: amountIn > 0n && !!address,
    },
  })

  // Approve token
  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Execute swap
  const { writeContract: swap, data: swapHash } = useWriteContract()
  const { isLoading: isSwapPending } = useWaitForTransactionReceipt({
    hash: swapHash,
  })

  // Handle quote errors
  useEffect(() => {
    if (quoteError) {
      if (quoteError.message.includes('InsufficientLiquidity')) {
        setError('Not enough liquidity available. Try a smaller amount.')
      } else {
        setError('Failed to get quote. Please try again.')
      }
    } else {
      setError(null)
    }
  }, [quoteError])

  const executeSwap = async () => {
    if (!quote || !address) return

    try {
      setError(null)

      // Step 1: Approve token
      const maxAmountIn = calculateMaxAmountIn(amountIn, slippage)
      
      await approve({
        address: tokenIn as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [DEX_CONTRACT as `0x${string}`, maxAmountIn],
      })

      // Wait for approval to complete
      if (approveHash) {
        // Step 2: Execute swap
        const minAmountOut = quote - (quote * BigInt(Math.floor(slippage * 100))) / 10000n

        await swap({
          address: DEX_CONTRACT as `0x${string}`,
          abi: dexAbi,
          functionName: 'swap',
          args: [
            tokenIn as `0x${string}`,
            tokenOut as `0x${string}`,
            amountIn,
            minAmountOut,
          ],
        })
      }
    } catch (err: any) {
      console.error('Swap error:', err)
      setError(err.message || 'Swap failed. Please try again.')
    }
  }

  return {
    quote,
    isLoadingQuote,
    executeSwap,
    isSwapping: isApprovePending || isSwapPending,
    error,
  }
}
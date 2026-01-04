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
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export default function useSwap({ tokenIn, tokenOut, amountIn, slippage }: UseSwapProps) {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)

  // Get quote from DEX
  const { 
    data: quote, 
    isLoading: isLoadingQuote, 
    error: quoteError,
    refetch: refetchQuote
  } = useReadContract({
    address: DEX_CONTRACT as `0x${string}`,
    abi: dexAbi,
    functionName: 'getQuote',
    args: amountIn > 0n ? [tokenIn as `0x${string}`, tokenOut as `0x${string}`, amountIn] : undefined,
    query: {
      enabled: amountIn > 0n && !!address && !!tokenIn && !!tokenOut,
      retry: 2,
    },
  })

  // Check current allowance
  const { data: currentAllowance } = useReadContract({
    address: tokenIn as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && tokenIn ? [address, DEX_CONTRACT as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!tokenIn,
    },
  })

  // Check if approval is needed
  useEffect(() => {
    if (currentAllowance !== undefined && amountIn > 0n) {
      setNeedsApproval(currentAllowance < amountIn)
    }
  }, [currentAllowance, amountIn])

  // Approve token
  const { 
    writeContract: approve, 
    data: approveHash,
    isPending: isApprovePending,
    error: approveError
  } = useWriteContract()

  const { 
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess 
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Execute swap
  const { 
    writeContract: swap, 
    data: swapHash,
    isPending: isSwapPending,
    error: swapError
  } = useWriteContract()

  const { 
    isLoading: isSwapConfirming,
    isSuccess: isSwapSuccess 
  } = useWaitForTransactionReceipt({
    hash: swapHash,
  })

  // Handle quote errors
  useEffect(() => {
    if (quoteError) {
      const errorMessage = quoteError.message || ''
      if (errorMessage.includes('InsufficientLiquidity')) {
        setError('Not enough liquidity available. Try a smaller amount.')
      } else if (errorMessage.includes('execution reverted')) {
        setError('Transaction would fail. Please check the amounts.')
      } else {
        setError('Failed to get quote. Please try again.')
      }
    }
  }, [quoteError])

  // Handle approve errors
  useEffect(() => {
    if (approveError) {
      console.error('Approve error:', approveError)
      setError('Failed to approve token. Please try again.')
    }
  }, [approveError])

  // Handle swap errors
  useEffect(() => {
    if (swapError) {
      console.error('Swap error:', swapError)
      setError('Swap failed. Please try again.')
    }
  }, [swapError])

  // Clear error when inputs change
  useEffect(() => {
    setError(null)
  }, [tokenIn, tokenOut, amountIn])

  const executeSwap = async () => {
    if (!quote || !address || !tokenIn || !tokenOut) {
      setError('Missing required parameters')
      return
    }

    if (amountIn === 0n) {
      setError('Amount must be greater than 0')
      return
    }

    try {
      setError(null)

      // Step 1: Approve token if needed
      if (needsApproval) {
        console.log('Approving token...', {
          token: tokenIn,
          spender: DEX_CONTRACT,
          amount: amountIn.toString()
        })

        const maxAmountIn = calculateMaxAmountIn(amountIn, slippage)
        
        approve({
          address: tokenIn as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [DEX_CONTRACT as `0x${string}`, maxAmountIn],
        })

        // Don't continue - wait for approval to complete
        // The user will need to click swap again after approval
        return
      }

      // Step 2: Execute swap (only if already approved or approval just completed)
      console.log('Executing swap...', {
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
        quote: quote.toString(),
        slippage
      })

      const minAmountOut = quote - (quote * BigInt(Math.floor(slippage * 100))) / 10000n

      swap({
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
    } catch (err: any) {
      console.error('Swap execution error:', err)
      setError(err.shortMessage || err.message || 'Swap failed. Please try again.')
    }
  }

  // Auto-execute swap after successful approval
  useEffect(() => {
    if (isApproveSuccess && !isSwapSuccess && quote && amountIn > 0n) {
      console.log('Approval successful, ready to swap')
      // Refetch quote to ensure it's still valid
      refetchQuote()
    }
  }, [isApproveSuccess, isSwapSuccess, quote, amountIn, refetchQuote])

  return {
    quote,
    isLoadingQuote,
    executeSwap,
    isSwapping: isApprovePending || isApproveConfirming || isSwapPending || isSwapConfirming,
    isApproveSuccess,
    isSwapSuccess,
    needsApproval,
    error,
  }
}
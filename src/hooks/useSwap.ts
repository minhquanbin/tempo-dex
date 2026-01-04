import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { DEX_CONTRACT } from '../constants/tokens'
import { calculateMaxAmountIn } from '../utils/slippage'
import { isAddress } from 'viem'

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

// ERC20 ABI for approve and allowance
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

  // Validate inputs before making any contract calls
  const isValidInput = 
    amountIn > 0n && 
    !!address && 
    !!tokenIn && 
    !!tokenOut && 
    isAddress(tokenIn) && 
    isAddress(tokenOut) &&
    isAddress(DEX_CONTRACT) &&
    tokenIn.toLowerCase() !== tokenOut.toLowerCase()

  // Get quote from DEX
  const { 
    data: quote, 
    isLoading: isLoadingQuote, 
    error: quoteError,
    refetch: refetchQuote
  } = useReadContract({
    address: isAddress(DEX_CONTRACT) ? DEX_CONTRACT as `0x${string}` : undefined,
    abi: dexAbi,
    functionName: 'getQuote',
    args: isValidInput 
      ? [tokenIn as `0x${string}`, tokenOut as `0x${string}`, amountIn] 
      : undefined,
    query: {
      enabled: isValidInput,
      retry: 1,
      retryDelay: 1000,
    },
  })

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: isAddress(tokenIn) ? tokenIn as `0x${string}` : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && isAddress(tokenIn) && isAddress(DEX_CONTRACT)
      ? [address, DEX_CONTRACT as `0x${string}`] 
      : undefined,
    query: {
      enabled: !!address && isAddress(tokenIn) && isAddress(DEX_CONTRACT),
      retry: 1,
    },
  })

  // Check if approval is needed
  useEffect(() => {
    if (currentAllowance !== undefined && amountIn > 0n) {
      setNeedsApproval(currentAllowance < amountIn)
    } else {
      setNeedsApproval(true)
    }
  }, [currentAllowance, amountIn])

  // Approve token
  const { 
    writeContract: approve, 
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove
  } = useWriteContract()

  const { 
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveReceiptError
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Execute swap
  const { 
    writeContract: swap, 
    data: swapHash,
    isPending: isSwapPending,
    error: swapError,
    reset: resetSwap
  } = useWriteContract()

  const { 
    isLoading: isSwapConfirming,
    isSuccess: isSwapSuccess,
    error: swapReceiptError
  } = useWaitForTransactionReceipt({
    hash: swapHash,
  })

  // Handle quote errors
  useEffect(() => {
    if (quoteError) {
      console.error('Quote error details:', quoteError)
      const errorMessage = quoteError.message || ''
      
      if (errorMessage.includes('InsufficientLiquidity')) {
        setError('Not enough liquidity available. Try a smaller amount.')
      } else if (errorMessage.includes('contract')) {
        setError('DEX contract not found. Please check contract address.')
      } else if (errorMessage.includes('execution reverted')) {
        setError('Cannot get quote. The pair may not exist.')
      } else {
        setError('Failed to get quote. Please check your inputs.')
      }
    }
  }, [quoteError])

  // Handle approve errors
  useEffect(() => {
    if (approveError) {
      console.error('Approve error:', approveError)
      const errorMessage = approveError.message || ''
      
      if (errorMessage.includes('User denied') || errorMessage.includes('User rejected')) {
        setError('Transaction rejected by user.')
      } else {
        setError('Failed to approve token. Please try again.')
      }
    }
  }, [approveError])

  // Handle approve receipt errors
  useEffect(() => {
    if (approveReceiptError) {
      console.error('Approve receipt error:', approveReceiptError)
      setError('Approval transaction failed.')
    }
  }, [approveReceiptError])

  // Handle swap errors
  useEffect(() => {
    if (swapError) {
      console.error('Swap error:', swapError)
      const errorMessage = swapError.message || ''
      
      if (errorMessage.includes('User denied') || errorMessage.includes('User rejected')) {
        setError('Transaction rejected by user.')
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for gas or amount.')
      } else {
        setError('Swap failed. Please try again.')
      }
    }
  }, [swapError])

  // Handle swap receipt errors
  useEffect(() => {
    if (swapReceiptError) {
      console.error('Swap receipt error:', swapReceiptError)
      setError('Swap transaction failed.')
    }
  }, [swapReceiptError])

  // Clear error when inputs change
  useEffect(() => {
    setError(null)
    resetApprove()
    resetSwap()
  }, [tokenIn, tokenOut, amountIn, resetApprove, resetSwap])

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isApproveSuccess) {
      console.log('Approval successful, refetching allowance...')
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  const executeSwap = async () => {
    if (!quote || !address) {
      setError('Missing required parameters')
      return
    }

    if (!isValidInput) {
      setError('Invalid input parameters')
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

        return // Wait for approval before swapping
      }

      // Step 2: Execute swap
      console.log('Executing swap...', {
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
        quote: quote.toString(),
        slippage
      })

      const minAmountOut = quote - (quote * BigInt(Math.floor(slippage * 100))) / 10000n

      if (minAmountOut <= 0n) {
        setError('Slippage too high, minimum output would be zero')
        return
      }

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
      setError(err.shortMessage || err.message || 'Operation failed. Please try again.')
    }
  }

  return {
    quote: isValidInput ? quote : null,
    isLoadingQuote: isValidInput && isLoadingQuote,
    executeSwap,
    isSwapping: isApprovePending || isApproveConfirming || isSwapPending || isSwapConfirming,
    isApproveSuccess,
    isSwapSuccess,
    needsApproval,
    error,
  }
}
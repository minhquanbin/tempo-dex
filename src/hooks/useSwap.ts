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
  useGasless?: boolean
  memo?: string
}

// DEX ABI - Tempo Stablecoin Exchange uses uint128 (not uint256!)
const dexAbi = [
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint128' },
    ],
    name: 'quoteSwapExactAmountIn',
    outputs: [{ name: 'amountOut', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint128' },
      { name: 'minAmountOut', type: 'uint128' },
    ],
    name: 'swapExactAmountIn',
    outputs: [{ name: 'amountOut', type: 'uint128' }],
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
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export default function useSwap({ 
  tokenIn, 
  tokenOut, 
  amountIn, 
  slippage,
  useGasless = false,
  memo = ''
}: UseSwapProps) {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Validate inputs before making any contract calls
  const isValidInput = 
    amountIn > 0n && 
    amountIn <= BigInt('0xffffffffffffffffffffffffffffffff') && // Max uint128
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
  } = useReadContract({
    address: isAddress(DEX_CONTRACT) ? DEX_CONTRACT as `0x${string}` : undefined,
    abi: dexAbi,
    functionName: 'quoteSwapExactAmountIn',
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
    setTxHash(null)
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

  // Store swap hash when successful
  useEffect(() => {
    if (swapHash) {
      setTxHash(swapHash)
      console.log('Swap transaction hash:', swapHash)
    }
  }, [swapHash])

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
      setTxHash(null)

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

      // Step 2: Execute swap (normal or gasless)
      if (useGasless) {
        await executeGaslessSwap()
      } else {
        await executeNormalSwap()
      }
    } catch (err: any) {
      console.error('Swap execution error:', err)
      setError(err.shortMessage || err.message || 'Operation failed. Please try again.')
    }
  }

  const executeNormalSwap = async () => {
    if (!quote || !address || !window.ethereum) {
      setError('Missing required parameters')
      return
    }

    console.log('💸 Executing normal swap...', {
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      quote: quote.toString(),
      slippage,
      memo: memo || 'none'
    })

    const minAmountOut = quote - (quote * BigInt(Math.floor(slippage * 100))) / 10000n

    if (minAmountOut <= 0n) {
      setError('Slippage too high, minimum output would be zero')
      return
    }

    // If memo provided, use eth_sendTransaction with custom data
    if (memo && memo.trim()) {
      try {
        // Build function selector for swapExactAmountIn
        const functionSelector = '0x8201aa3f' // keccak256("swapExactAmountIn(address,address,uint128,uint128)")
        
        // Encode parameters
        const tokenInPadded = tokenIn.slice(2).padStart(64, '0')
        const tokenOutPadded = tokenOut.slice(2).padStart(64, '0')
        const amountInHex = amountIn.toString(16).padStart(32, '0') // uint128 = 16 bytes = 32 hex chars
        const minAmountOutHex = minAmountOut.toString(16).padStart(32, '0')
        
        let txData = functionSelector + tokenInPadded + tokenOutPadded + amountInHex + minAmountOutHex
        
        // Append memo
        const memoBytes = new TextEncoder().encode(memo.trim())
        const memoHex = Array.from(memoBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
        txData += memoHex
        
        console.log('📝 Memo added to transaction:', memo)
        
        const hash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: DEX_CONTRACT,
            data: txData,
            value: '0x0'
          }],
        }) as string

        setTxHash(hash)
        console.log('✅ Normal swap with memo executed:', hash)
        return
      } catch (err) {
        console.error('Failed to send with memo, falling back to wagmi...', err)
        // Fall through to wagmi method below
      }
    }

    // Standard swap without memo or as fallback
    swap({
      address: DEX_CONTRACT as `0x${string}`,
      abi: dexAbi,
      functionName: 'swapExactAmountIn',
      args: [
        tokenIn as `0x${string}`,
        tokenOut as `0x${string}`,
        amountIn,
        minAmountOut,
      ],
    })
  }

  const executeGaslessSwap = async () => {
    if (!quote || !address || !window.ethereum) {
      setError('Missing required parameters')
      return
    }

    console.log('🎁 Executing gasless swap...')

    const minAmountOut = quote - (quote * BigInt(Math.floor(slippage * 100))) / 10000n

    if (minAmountOut <= 0n) {
      setError('Slippage too high, minimum output would be zero')
      return
    }

    // Build transaction data
    const functionSelector = '0x8201aa3f'
    const tokenInPadded = tokenIn.slice(2).padStart(64, '0')
    const tokenOutPadded = tokenOut.slice(2).padStart(64, '0')
    const amountInHex = amountIn.toString(16).padStart(32, '0')
    const minAmountOutHex = minAmountOut.toString(16).padStart(32, '0')
    
    let txData = functionSelector + tokenInPadded + tokenOutPadded + amountInHex + minAmountOutHex
    
    // Append memo with [GASLESS] prefix
    const fullMemo = memo && memo.trim() 
      ? `[GASLESS] ${memo.trim()}` 
      : '[GASLESS]'
    
    const memoBytes = new TextEncoder().encode(fullMemo)
    const memoHex = Array.from(memoBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    txData += memoHex
    console.log('📝 Gasless memo added:', fullMemo)

    const txPayload = {
      from: address,
      to: DEX_CONTRACT,
      data: txData,
      value: '0x0',
      gasLimit: '0x100000' // 1M gas
    }

    try {
      // Try fee payer service
      const feePayerUrl = 'https://sponsor.testnet.tempo.xyz'
      
      const response = await fetch(feePayerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: txPayload,
          chainId: 41144114 // Tempo testnet
        })
      })

      if (!response.ok) {
        throw new Error('Fee payer service unavailable')
      }

      const { sponsoredTx } = await response.json()

      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [sponsoredTx],
      }) as string

      setTxHash(hash)
      console.log('✅ Gasless swap executed:', hash)
      
    } catch (feePayerError) {
      console.error('Fee payer error:', feePayerError)
      console.log('⚠️ Falling back to normal transaction...')
      
      // Fallback to normal transaction
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txPayload],
      }) as string

      setTxHash(hash)
      console.log('✅ Swap executed (normal fallback):', hash)
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
    txHash,
  }
}
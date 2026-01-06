import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { DEX_CONTRACT, TOKENS } from '../constants/tokens'

interface AddLiquidityParams {
  token: string
  amount: bigint
  price: number
  orderType: 'buy' | 'sell'
}

// Tempo DEX ABI - Correct according to official docs
const dexAbi = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'isBid', type: 'bool' },
      { name: 'tick', type: 'int16' },
    ],
    name: 'place',
    outputs: [{ name: 'orderId', type: 'uint128' }],
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

export default function useLiquidity() {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [tokenToApprove, setTokenToApprove] = useState<string>('')
  const [pendingParams, setPendingParams] = useState<AddLiquidityParams | null>(null)

  // Check allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenToApprove as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && tokenToApprove ? [address, DEX_CONTRACT as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!tokenToApprove,
    },
  })

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
    isSuccess: isApproveSuccess 
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Place order
  const { 
    writeContract: placeOrder, 
    data: orderHash,
    isPending: isOrderPending,
    error: orderError,
    reset: resetOrder
  } = useWriteContract()

  const { 
    isLoading: isOrderConfirming,
    isSuccess: isOrderSuccess 
  } = useWaitForTransactionReceipt({
    hash: orderHash,
  })

  // Auto-place order after successful approval
  useEffect(() => {
    if (isApproveSuccess && pendingParams && !isOrderSuccess) {
      console.log('Approval successful, placing order...')
      refetchAllowance()
      
      setTimeout(() => {
        executePlaceOrder(pendingParams)
      }, 1000)
    }
  }, [isApproveSuccess, pendingParams, isOrderSuccess])

  // Clear pending params after successful order
  useEffect(() => {
    if (isOrderSuccess) {
      setPendingParams(null)
      setNeedsApproval(false)
    }
  }, [isOrderSuccess])

  // Handle errors
  useEffect(() => {
    if (approveError) {
      console.error('Approve error:', approveError)
      setError('Failed to approve token: ' + (approveError.message || 'Unknown error'))
    }
  }, [approveError])

  useEffect(() => {
    if (orderError) {
      console.error('Order error:', orderError)
      setError('Failed to place order: ' + (orderError.message || 'Unknown error'))
    }
  }, [orderError])

  // Convert price to tick according to Tempo docs
  // tick = (price - 1) * 100_000
  // Limited to ±2000 ticks (±2% from peg)
  const priceToTick = (price: number): number => {
    const tick = Math.round((price - 1) * 100000)
    
    // Clamp to ±2000 range
    if (tick > 2000) return 2000
    if (tick < -2000) return -2000
    
    return tick
  }

  const executePlaceOrder = async (params: AddLiquidityParams) => {
    try {
      const tick = priceToTick(params.price)
      const isBid = params.orderType === 'buy'

      console.log('Placing order:', {
        token: params.token,
        amount: params.amount.toString(),
        isBid,
        orderType: params.orderType,
        price: params.price,
        tick
      })

      placeOrder({
        address: DEX_CONTRACT as `0x${string}`,
        abi: dexAbi,
        functionName: 'place',
        args: [
          params.token as `0x${string}`, 
          params.amount, 
          isBid,
          tick
        ],
      })
    } catch (err: any) {
      console.error('Place order error:', err)
      setError(err.message || 'Failed to place order')
    }
  }

  const addLiquidity = async (params: AddLiquidityParams) => {
    if (!address) {
      setError('Wallet not connected')
      return
    }

    try {
      setError(null)
      resetApprove()
      resetOrder()

      // Determine which token needs approval
      // For buy orders: approve pathUSD (quote token)
      // For sell orders: approve the token itself
      const tokenForApproval = params.orderType === 'buy' ? TOKENS.pathUSD : params.token
      setTokenToApprove(tokenForApproval)

      // Check if approval is needed
      if (currentAllowance !== undefined && currentAllowance < params.amount) {
        setNeedsApproval(true)
        setPendingParams(params)

        console.log('Approving token:', {
          token: tokenForApproval,
          amount: params.amount.toString()
        })

        // Approve token
        approve({
          address: tokenForApproval as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [DEX_CONTRACT as `0x${string}`, params.amount],
        })
      } else {
        // Already approved, place order directly
        setNeedsApproval(false)
        await executePlaceOrder(params)
      }
    } catch (err: any) {
      console.error('Add liquidity error:', err)
      setError(err.shortMessage || err.message || 'Failed to add liquidity')
    }
  }

  return {
    addLiquidity,
    isAdding: isApprovePending || isApproveConfirming || isOrderPending || isOrderConfirming,
    isApproveSuccess,
    isOrderSuccess,
    needsApproval,
    error,
  }
}
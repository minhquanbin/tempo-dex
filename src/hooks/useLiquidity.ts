import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { DEX_CONTRACT, TOKENS } from '../constants/tokens'

interface AddLiquidityParams {
  token: string
  amount: bigint
  price: number
  orderType: 'buy' | 'sell'
}

// DEX ABI for liquidity operations
const dexAbi = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'price', type: 'uint128' },
    ],
    name: 'placeBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'price', type: 'uint128' },
    ],
    name: 'placeSellOrder',
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
      
      // Wait a bit for allowance to update
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

  const executePlaceOrder = async (params: AddLiquidityParams) => {
    try {
      // Convert price to uint128 (6 decimals for testnet)
      const priceScaled = BigInt(Math.floor(params.price * 1e6))

      const functionName = params.orderType === 'buy' ? 'placeBuyOrder' : 'placeSellOrder'

      console.log('Placing order:', {
        function: functionName,
        token: params.token,
        amount: params.amount.toString(),
        price: priceScaled.toString()
      })

      placeOrder({
        address: DEX_CONTRACT as `0x${string}`,
        abi: dexAbi,
        functionName,
        args: [params.token as `0x${string}`, params.amount, priceScaled],
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
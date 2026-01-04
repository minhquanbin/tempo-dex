import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
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
      { name: 'amount', type: 'uint256' },
      { name: 'price', type: 'uint256' },
    ],
    name: 'placeBuyOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'price', type: 'uint256' },
    ],
    name: 'placeSellOrder',
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

export default function useLiquidity() {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)

  // Approve token
  const { writeContract: approve, data: approveHash } = useWriteContract()
  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Place order
  const { writeContract: placeOrder, data: orderHash } = useWriteContract()
  const { isLoading: isOrderPending } = useWaitForTransactionReceipt({
    hash: orderHash,
  })

  const addLiquidity = async ({ token, amount, price, orderType }: AddLiquidityParams) => {
    if (!address) return

    try {
      setError(null)

      // Convert price to wei (assuming 18 decimals for price)
      const priceWei = BigInt(Math.floor(price * 1e18))

      // Step 1: Approve token (or pathUSD for buy orders)
      const tokenToApprove = orderType === 'buy' ? TOKENS.pathUSD : token

      await approve({
        address: tokenToApprove as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [DEX_CONTRACT as `0x${string}`, amount],
      })

      // Wait for approval
      if (approveHash) {
        // Step 2: Place order
        const functionName = orderType === 'buy' ? 'placeBuyOrder' : 'placeSellOrder'

        await placeOrder({
          address: DEX_CONTRACT as `0x${string}`,
          abi: dexAbi,
          functionName,
          args: [token as `0x${string}`, amount, priceWei],
        })
      }
    } catch (err: any) {
      console.error('Add liquidity error:', err)
      setError(err.message || 'Failed to add liquidity. Please try again.')
    }
  }

  return {
    addLiquidity,
    isAdding: isApprovePending || isOrderPending,
    error,
  }
}
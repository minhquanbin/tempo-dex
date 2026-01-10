import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { 
  CCIP_ROUTER_ADDRESSES, 
  CCIP_CHAIN_SELECTORS, 
  LINK_TOKEN_ADDRESSES,
  CCIPFeeOption,
  CCIP_GAS_LIMITS 
} from '../constants/ccip'
import { isAddress, encodeFunctionData } from 'viem'

interface UseBridgeProps {
  sourceChainId: number
  destinationChainId: number
  tokenAddress: string
  amount: bigint
  recipientAddress?: string
  feeOption: CCIPFeeOption
}

// ✅ FIX: Thêm destinationChainSelector vào getFee
const ccipRouterAbi = [
  {
    inputs: [
      { name: 'destinationChainSelector', type: 'uint64' },
      {
        components: [
          { name: 'receiver', type: 'bytes' },
          { name: 'data', type: 'bytes' },
          {
            name: 'tokenAmounts',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          { name: 'feeToken', type: 'address' },
          { name: 'extraArgs', type: 'bytes' },
        ],
        name: 'message',
        type: 'tuple',
      },
    ],
    name: 'getFee',
    outputs: [{ name: 'fee', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'destinationChainSelector', type: 'uint64' },
      {
        components: [
          { name: 'receiver', type: 'bytes' },
          { name: 'data', type: 'bytes' },
          {
            name: 'tokenAmounts',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          { name: 'feeToken', type: 'address' },
          { name: 'extraArgs', type: 'bytes' },
        ],
        name: 'message',
        type: 'tuple',
      },
    ],
    name: 'ccipSend',
    outputs: [{ name: 'messageId', type: 'bytes32' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

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

export default function useBridge({
  sourceChainId,
  destinationChainId,
  tokenAddress,
  amount,
  recipientAddress,
  feeOption,
}: UseBridgeProps) {
  const { address, chainId } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [messageId, setMessageId] = useState<string | null>(null)

  const recipient = recipientAddress || address
  const routerAddress = CCIP_ROUTER_ADDRESSES[sourceChainId as keyof typeof CCIP_ROUTER_ADDRESSES]
  const destinationSelector = CCIP_CHAIN_SELECTORS[destinationChainId as keyof typeof CCIP_CHAIN_SELECTORS]
  const linkAddress = LINK_TOKEN_ADDRESSES[sourceChainId as keyof typeof LINK_TOKEN_ADDRESSES]

  const isValidInput =
    amount > 0n &&
    !!address &&
    !!recipient &&
    !!routerAddress &&
    !!destinationSelector &&
    isAddress(tokenAddress) &&
    isAddress(routerAddress) &&
    isAddress(recipient) &&
    chainId === sourceChainId

  const buildCCIPMessage = () => {
    if (!recipient || !isValidInput) return null

    const receiverBytes = recipient as `0x${string}`

    const tokenAmounts = [
      {
        token: tokenAddress as `0x${string}`,
        amount: amount,
      },
    ]

    const feeToken = feeOption === CCIPFeeOption.NATIVE 
      ? '0x0000000000000000000000000000000000000000' as `0x${string}`
      : linkAddress as `0x${string}`

    const extraArgs = encodeFunctionData({
      abi: [{
        inputs: [{ name: 'gasLimit', type: 'uint256' }],
        name: 'extraArgs',
        outputs: [],
        stateMutability: 'pure',
        type: 'function',
      }],
      functionName: 'extraArgs',
      args: [CCIP_GAS_LIMITS.TRANSFER],
    })

    return {
      receiver: receiverBytes,
      data: '0x' as `0x${string}`,
      tokenAmounts,
      feeToken,
      extraArgs: extraArgs || '0x' as `0x${string}`,
    }
  }

  const ccipMessage = buildCCIPMessage()

  // ✅ FIX: Thêm destinationSelector vào args
  const {
    data: estimatedFee,
    isLoading: isLoadingFee,
    error: feeError,
  } = useReadContract({
    address: routerAddress as `0x${string}`,
    abi: ccipRouterAbi,
    functionName: 'getFee',
    args: ccipMessage ? [BigInt(destinationSelector), ccipMessage] : undefined,
    query: {
      enabled: isValidInput && !!ccipMessage && !!destinationSelector,
      retry: 2,
    },
  })

  // Debug logging
  useEffect(() => {
    if (isValidInput && ccipMessage) {
      console.log('🔍 Bridge Config:', {
        sourceChain: sourceChainId,
        destinationChain: destinationChainId,
        routerAddress,
        destinationSelector,
        tokenAddress,
        amount: amount.toString(),
      })
    }
    if (feeError) {
      console.error('❌ Fee Error:', feeError)
    }
    if (estimatedFee) {
      console.log('✅ Fee:', estimatedFee.toString())
    }
  }, [isValidInput, ccipMessage, feeError, estimatedFee, sourceChainId, destinationChainId, routerAddress, destinationSelector, tokenAddress, amount])

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && routerAddress 
      ? [address, routerAddress as `0x${string}`] 
      : undefined,
    query: {
      enabled: !!address && isAddress(tokenAddress) && isAddress(routerAddress),
    },
  })

  useEffect(() => {
    if (currentAllowance !== undefined && amount > 0n) {
      setNeedsApproval(currentAllowance < amount)
    } else {
      setNeedsApproval(true)
    }
  }, [currentAllowance, amount])

  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract()

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const {
    writeContract: bridge,
    data: bridgeHash,
    isPending: isBridgePending,
    error: bridgeError,
    reset: resetBridge,
  } = useWriteContract()

  const {
    isLoading: isBridgeConfirming,
    isSuccess: isBridgeSuccess,
  } = useWaitForTransactionReceipt({
    hash: bridgeHash,
  })

  useEffect(() => {
    if (chainId !== sourceChainId) {
      setError(`Please switch to the source chain`)
    } else if (feeError) {
      setError('Failed to estimate bridge fee. CCIP may not be configured.')
    } else if (approveError) {
      setError('Token approval failed.')
    } else if (bridgeError) {
      setError('Bridge transaction failed.')
    } else {
      setError(null)
    }
  }, [chainId, sourceChainId, feeError, approveError, bridgeError])

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    setError(null)
    setMessageId(null)
    resetApprove()
    resetBridge()
  }, [sourceChainId, destinationChainId, tokenAddress, amount, resetApprove, resetBridge])

  const executeBridge = async () => {
    if (!ccipMessage || !address || !isValidInput) {
      setError('Invalid bridge parameters')
      return
    }

    try {
      setError(null)
      setMessageId(null)

      if (needsApproval) {
        console.log('Approving token...', {
          token: tokenAddress,
          router: routerAddress,
          amount: amount.toString(),
        })

        approve({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [routerAddress as `0x${string}`, amount],
        })

        return
      }

      console.log('🌉 Bridging...', {
        from: sourceChainId,
        to: destinationChainId,
        token: tokenAddress,
        amount: amount.toString(),
        recipient,
        fee: estimatedFee?.toString(),
      })

      bridge({
        address: routerAddress as `0x${string}`,
        abi: ccipRouterAbi,
        functionName: 'ccipSend',
        args: [BigInt(destinationSelector), ccipMessage],
        value: feeOption === CCIPFeeOption.NATIVE ? estimatedFee : 0n,
      })

    } catch (err: any) {
      console.error('Bridge error:', err)
      setError(err.shortMessage || err.message || 'Bridge failed')
    }
  }

  return {
    estimatedFee,
    isLoadingFee,
    executeBridge,
    isBridging: isApprovePending || isApproveConfirming || isBridgePending || isBridgeConfirming,
    isApproveSuccess,
    isBridgeSuccess,
    needsApproval,
    error,
    messageId,
    isWrongChain: chainId !== sourceChainId,
  }
}
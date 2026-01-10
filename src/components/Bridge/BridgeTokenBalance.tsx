import { useAccount, useReadContract } from 'wagmi'
import { formatTokenAmount, CCIP_BNM_DECIMALS } from '../../utils/formatting'

interface BridgeTokenBalanceProps {
  token: string
  tokenSymbol: string
}

// ERC20 ABI for balanceOf
const erc20Abi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

function BridgeTokenBalance({ token, tokenSymbol }: BridgeTokenBalanceProps) {
  const { address } = useAccount()

  const { data: balance, isLoading } = useReadContract({
    address: token as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  })

  if (isLoading) {
    return <span className="text-xs text-gray-400">Loading...</span>
  }

  // Use 18 decimals for CCIP-BnM
  const decimals = CCIP_BNM_DECIMALS

  return (
    <span className="text-xs text-gray-500">
      Balance: <span className="font-semibold">{formatTokenAmount(balance, decimals, 6)}</span> {tokenSymbol}
    </span>
  )
}

export default BridgeTokenBalance
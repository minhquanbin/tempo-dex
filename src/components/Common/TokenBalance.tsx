import { useAccount, useReadContract } from 'wagmi'
import { formatTokenAmount } from '../../utils/formatting'
import { TOKEN_NAMES } from '../../constants/tokens'

interface TokenBalanceProps {
  token: string
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

export default function TokenBalance({ token }: TokenBalanceProps) {
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

  const tokenName = TOKEN_NAMES[token as keyof typeof TOKEN_NAMES]

  if (isLoading) {
    return <span className="text-xs text-gray-400">Loading...</span>
  }

  return (
    <span className="text-xs text-gray-500">
      Balance: <span className="font-semibold">{formatTokenAmount(balance)}</span> {tokenName}
    </span>
  )
}
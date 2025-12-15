import { getContractConfig } from "@/config/contracts"
import { CHAIN_ID } from "@repo/shared/contracts"
import type { Address, Hex } from "viem"
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"

type VoteStateResult = {
  lastVoted: bigint | undefined
  usedWeight: bigint | undefined
  canVoteInCurrentEpoch: boolean
  hasVotedThisEpoch: boolean
  isInVotingWindow: boolean
  epochNext: bigint | undefined
  isLoading: boolean
}

export function useVoteState(tokenId: bigint | undefined): VoteStateResult {
  const contracts = getContractConfig(CHAIN_ID.testnet)
  const now = BigInt(Math.floor(Date.now() / 1000))

  const { data, isLoading } = useReadContract({
    ...contracts.boostVoter,
    functionName: "lastVoted",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  })

  const { data: usedWeight } = useReadContract({
    ...contracts.boostVoter,
    functionName: "usedWeights",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  })

  const { data: epochNextData } = useReadContract({
    ...contracts.boostVoter,
    functionName: "epochNext",
    args: [now],
  })

  const lastVoted = data as bigint | undefined
  const epochNext = epochNextData as bigint | undefined

  // Contract check: epochStart(block.timestamp) <= lastVoted[_tokenId]
  // epochStart = epochNext - 604800 (7 days)
  const epochStart = epochNext !== undefined ? epochNext - 604800n : undefined

  // Can vote if lastVoted < epochStart (haven't voted this epoch)
  const hasNotVotedThisEpoch =
    lastVoted !== undefined && epochStart !== undefined
      ? lastVoted < epochStart
      : true

  // Also check we're in the voting window (after first hour, before last hour)
  // epochVoteStart = epochStart + 1 hour
  // epochVoteEnd = epochNext - 1 hour
  const epochVoteStart =
    epochStart !== undefined ? epochStart + 3600n : undefined
  const epochVoteEnd = epochNext !== undefined ? epochNext - 3600n : undefined
  const isInVotingWindow =
    epochVoteStart !== undefined && epochVoteEnd !== undefined
      ? now > epochVoteStart && now <= epochVoteEnd
      : true

  const canVoteInCurrentEpoch = hasNotVotedThisEpoch && isInVotingWindow

  return {
    lastVoted,
    usedWeight: usedWeight as bigint | undefined,
    canVoteInCurrentEpoch,
    hasVotedThisEpoch: !hasNotVotedThisEpoch,
    isInVotingWindow,
    epochNext,
    isLoading,
  }
}

type WriteHookResult = {
  hash: Hex | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
}

type CreateBoostGaugeResult = WriteHookResult & {
  createGauge: (
    veBTCTokenId: bigint,
    bribeTokens?: Address[],
    bribeAmounts?: bigint[],
  ) => void
}

export function useCreateBoostGauge(): CreateBoostGaugeResult {
  const contracts = getContractConfig(CHAIN_ID.testnet)
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const createGauge = (
    veBTCTokenId: bigint,
    bribeTokens: Address[] = [],
    bribeAmounts: bigint[] = [],
  ) => {
    const { address, abi } = contracts.boostVoter
    const gaugeFactoryAddress = contracts.gaugeFactory.address

    if (!address || !gaugeFactoryAddress) {
      return
    }

    writeContract({
      address,
      abi,
      functionName: "createBoostGauge",
      args: [gaugeFactoryAddress, veBTCTokenId, bribeTokens, bribeAmounts],
    })
  }

  return {
    createGauge,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

type VoteOnGaugeResult = WriteHookResult & {
  vote: (
    veMEZOTokenId: bigint,
    gaugeAddresses: Address[],
    weights: bigint[],
  ) => void
}

export function useVoteOnGauge(): VoteOnGaugeResult {
  const contracts = getContractConfig(CHAIN_ID.testnet)
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const vote = (
    veMEZOTokenId: bigint,
    gaugeAddresses: Address[],
    weights: bigint[],
  ) => {
    const { address, abi } = contracts.boostVoter
    if (!address) return

    writeContract({
      address,
      abi,
      functionName: "vote",
      args: [veMEZOTokenId, gaugeAddresses, weights],
    })
  }

  return {
    vote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

type ResetVoteResult = WriteHookResult & {
  reset: (veMEZOTokenId: bigint) => void
}

export function useResetVote(): ResetVoteResult {
  const contracts = getContractConfig(CHAIN_ID.testnet)
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const reset = (veMEZOTokenId: bigint) => {
    const { address, abi } = contracts.boostVoter
    if (!address) return

    writeContract({
      address,
      abi,
      functionName: "reset",
      args: [veMEZOTokenId],
    })
  }

  return {
    reset,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

type PokeBoostResult = WriteHookResult & {
  pokeBoost: (veBTCTokenId: bigint) => void
}

export function usePokeBoost(): PokeBoostResult {
  const contracts = getContractConfig(CHAIN_ID.testnet)
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const pokeBoost = (veBTCTokenId: bigint) => {
    const { address, abi } = contracts.boostVoter
    if (!address) return

    writeContract({
      address,
      abi,
      functionName: "pokeBoost",
      args: [veBTCTokenId],
    })
  }

  return {
    pokeBoost,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

type RefetchFn = () => Promise<unknown>

export function useBribeAddress(gaugeAddress: Address | undefined): {
  bribeAddress: Address | undefined
  hasBribe: boolean
  isLoading: boolean
  refetch: RefetchFn
} {
  const contracts = getContractConfig(CHAIN_ID.testnet)

  const { data, isLoading, refetch } = useReadContract({
    ...contracts.boostVoter,
    functionName: "gaugeToBribe",
    args: gaugeAddress ? [gaugeAddress] : undefined,
    query: {
      enabled: !!gaugeAddress,
    },
  })

  const bribeAddress = data as Address | undefined
  const hasBribe =
    bribeAddress !== undefined &&
    bribeAddress !== "0x0000000000000000000000000000000000000000"

  return {
    bribeAddress: hasBribe ? bribeAddress : undefined,
    hasBribe,
    isLoading,
    refetch,
  }
}

export type BribeIncentive = {
  tokenAddress: Address
  symbol: string
  decimals: number
  amount: bigint
}

const EPOCH_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

function getEpochStart(timestamp: number): bigint {
  return BigInt(Math.floor(timestamp / EPOCH_DURATION) * EPOCH_DURATION)
}

export function useBribeIncentives(bribeAddress: Address | undefined): {
  incentives: BribeIncentive[]
  isLoading: boolean
  refetch: RefetchFn
} {
  const { data: lengthData, isLoading: isLoadingLength } = useReadContract({
    address: bribeAddress,
    abi: [
      {
        inputs: [],
        name: "rewardsListLength",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "rewardsListLength",
    query: {
      enabled: !!bribeAddress,
    },
  })

  const length = Number(lengthData ?? 0n)

  // Fetch reward token addresses
  const { data: rewardTokensData, isLoading: isLoadingTokens } =
    useReadContracts({
      contracts: Array.from({ length }, (_, i) => ({
        address: bribeAddress,
        abi: [
          {
            inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            name: "rewards",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "rewards" as const,
        args: [BigInt(i)],
      })),
      query: {
        enabled: !!bribeAddress && length > 0,
      },
    })

  const tokenAddresses =
    rewardTokensData?.map((r) => r.result as Address).filter(Boolean) ?? []

  // Get current epoch start
  const currentEpochStart = getEpochStart(Math.floor(Date.now() / 1000))

  // Fetch token rewards for current epoch
  const { data: amountsData, isLoading: isLoadingAmounts } = useReadContracts({
    contracts: tokenAddresses.map((tokenAddress) => ({
      address: bribeAddress,
      abi: [
        {
          inputs: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "epochStart", type: "uint256" },
          ],
          name: "tokenRewardsPerEpoch",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const,
      functionName: "tokenRewardsPerEpoch" as const,
      args: [tokenAddress, currentEpochStart],
    })),
    query: {
      enabled: tokenAddresses.length > 0,
    },
  })

  // Fetch token metadata (symbol and decimals)
  const {
    data: metadataData,
    isLoading: isLoadingMetadata,
    refetch,
  } = useReadContracts({
    contracts: tokenAddresses.flatMap((tokenAddress) => [
      {
        address: tokenAddress,
        abi: [
          {
            inputs: [],
            name: "symbol",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "symbol" as const,
      },
      {
        address: tokenAddress,
        abi: [
          {
            inputs: [],
            name: "decimals",
            outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "decimals" as const,
      },
    ]),
    query: {
      enabled: tokenAddresses.length > 0,
    },
  })

  const incentives: BribeIncentive[] = tokenAddresses.map(
    (tokenAddress, i) => ({
      tokenAddress,
      symbol: (metadataData?.[i * 2]?.result as string) ?? "???",
      decimals: Number(metadataData?.[i * 2 + 1]?.result ?? 18),
      amount: (amountsData?.[i]?.result as bigint) ?? 0n,
    }),
  )

  return {
    incentives: incentives.filter((i) => i.amount > 0n),
    isLoading:
      isLoadingLength ||
      isLoadingTokens ||
      isLoadingAmounts ||
      isLoadingMetadata,
    refetch,
  }
}

export function useTokenAllowance(
  tokenAddress: Address | undefined,
  spenderAddress: Address | undefined,
): {
  allowance: bigint | undefined
  isLoading: boolean
  refetch: RefetchFn
} {
  const { address: userAddress } = useAccount()

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "allowance",
    args:
      userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!spenderAddress && !!userAddress,
    },
  })

  return {
    allowance: data as bigint | undefined,
    isLoading,
    refetch,
  }
}

export function useApproveToken(): {
  approve: (tokenAddress: Address, spenderAddress: Address) => void
  hash: Hex | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
  reset: () => void
} {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = (tokenAddress: Address, spenderAddress: Address) => {
    writeContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
      functionName: "approve",
      args: [spenderAddress, BigInt(2) ** BigInt(256) - BigInt(1)], // max approval
    })
  }

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

type AddIncentivesResult = WriteHookResult & {
  addIncentives: (
    gaugeAddress: Address,
    tokens: Address[],
    amounts: bigint[],
  ) => void
}

export function useBoostVoterAddress(): Address | undefined {
  const contracts = getContractConfig(CHAIN_ID.testnet)
  return contracts.boostVoter.address
}

export function useIsAllowlistedToken(tokenAddress: Address | undefined): {
  isAllowlisted: boolean | undefined
  isLoading: boolean
} {
  const contracts = getContractConfig(CHAIN_ID.testnet)

  const { data, isLoading } = useReadContract({
    ...contracts.boostVoter,
    functionName: "isWhitelistedToken",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  })

  return {
    isAllowlisted: data as boolean | undefined,
    isLoading,
  }
}

export type VoteAllocation = {
  gaugeAddress: Address
  weight: bigint
}

export function useVoteAllocations(
  tokenId: bigint | undefined,
  gaugeAddresses: Address[],
): {
  allocations: VoteAllocation[]
  isLoading: boolean
} {
  const contracts = getContractConfig(CHAIN_ID.testnet)

  const { data, isLoading } = useReadContracts({
    contracts: gaugeAddresses.map((gaugeAddress) => ({
      ...contracts.boostVoter,
      functionName: "votes",
      args: tokenId !== undefined ? [tokenId, gaugeAddress] : undefined,
    })),
    query: {
      enabled: tokenId !== undefined && gaugeAddresses.length > 0,
    },
  })

  const allocations: VoteAllocation[] = gaugeAddresses
    .map((gaugeAddress, i) => ({
      gaugeAddress,
      weight: (data?.[i]?.result as bigint) ?? 0n,
    }))
    .filter((a) => a.weight > 0n)

  return {
    allocations,
    isLoading,
  }
}

export function useAddIncentives(): AddIncentivesResult {
  const contracts = getContractConfig(CHAIN_ID.testnet)
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const addIncentives = (
    gaugeAddress: Address,
    tokens: Address[],
    amounts: bigint[],
  ) => {
    const { address, abi } = contracts.boostVoter
    if (!address) return

    writeContract({
      address,
      abi,
      functionName: "addBribes",
      args: [gaugeAddress, tokens, amounts],
    })
  }

  return {
    addIncentives,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

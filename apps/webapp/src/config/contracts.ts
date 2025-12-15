import {
  BOOST_VOTER_ABI,
  CHAIN_ID,
  CONTRACTS,
  ERC20_ABI,
  POOLS_VOTER_ABI,
  type SupportedChainId,
  VOTING_ESCROW_ABI,
} from "@repo/shared/contracts"

export function getContractConfig(
  chainId: SupportedChainId = CHAIN_ID.testnet,
) {
  const addresses =
    chainId === CHAIN_ID.testnet ? CONTRACTS.testnet : CONTRACTS.mainnet

  return {
    mezoToken: {
      address: addresses.mezoToken,
      abi: ERC20_ABI,
    },
    veMEZO: {
      address: addresses.veMEZO,
      abi: VOTING_ESCROW_ABI,
    },
    veBTC: {
      address: addresses.veBTC,
      abi: VOTING_ESCROW_ABI,
    },
    boostVoter: {
      address: addresses.boostVoter,
      abi: BOOST_VOTER_ABI,
    },
    poolsVoter: {
      address: addresses.poolsVoter,
      abi: POOLS_VOTER_ABI,
    },
    gaugeFactory: {
      address: addresses.gaugeFactory,
    },
  }
}

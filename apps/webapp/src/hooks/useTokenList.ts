import { CHAIN_ID } from "@repo/shared/contracts"
import { useEffect, useState } from "react"
import type { Address } from "viem"
import { erc20Abi } from "viem"
import { useReadContracts } from "wagmi"

export type Token = {
  chainId: number
  address: Address
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

type TokenList = {
  name: string
  tokens: Token[]
}

const DEFAULT_TOKEN_LIST_URL =
  "https://tokens.coingecko.com/uniswap/all.json" as const

export function useTokenList(tokenListUrl?: string) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTokenList = async () => {
      try {
        setIsLoading(true)
        const url = tokenListUrl || DEFAULT_TOKEN_LIST_URL
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch token list: ${response.statusText}`)
        }
        const data: TokenList = await response.json()
        const chainTokens = data.tokens.filter(
          (token) => token.chainId === CHAIN_ID.testnet,
        )
        setTokens(chainTokens)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setTokens([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenList()
  }, [tokenListUrl])

  return { tokens, isLoading, error }
}

export function useCustomToken(address: Address | undefined) {
  const { data, isLoading } = useReadContracts({
    contracts: address
      ? [
          {
            address,
            abi: erc20Abi,
            functionName: "name",
          },
          {
            address,
            abi: erc20Abi,
            functionName: "symbol",
          },
          {
            address,
            abi: erc20Abi,
            functionName: "decimals",
          },
        ]
      : [],
    query: {
      enabled: !!address,
    },
  })

  if (!address || isLoading || !data) {
    return { token: undefined, isLoading }
  }

  const [nameResult, symbolResult, decimalsResult] = data

  if (
    !nameResult ||
    !symbolResult ||
    !decimalsResult ||
    nameResult.error ||
    symbolResult.error ||
    decimalsResult.error
  ) {
    return { token: undefined, isLoading: false }
  }

  const token: Token = {
    chainId: CHAIN_ID.testnet,
    address,
    name: nameResult.result as string,
    symbol: symbolResult.result as string,
    decimals: decimalsResult.result as number,
  }

  return { token, isLoading }
}

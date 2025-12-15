import { CHAIN_ID } from "@repo/shared/contracts"
import { defineChain } from "viem"
import { http, type Config, createConfig } from "wagmi"
import { injected } from "wagmi/connectors"

export const mezoTestnet = defineChain({
  id: CHAIN_ID.testnet,
  name: "Mezo Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Bitcoin",
    symbol: "BTC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mezo Explorer",
      url: "https://explorer.test.mezo.org",
    },
  },
})

export const wagmiConfig: Config = createConfig({
  chains: [mezoTestnet],
  connectors: [injected()],
  transports: {
    [mezoTestnet.id]: http(),
  },
})

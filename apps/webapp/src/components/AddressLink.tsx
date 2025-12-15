import { mezoTestnet } from "@/config/wagmi"
import { LinkExternal02, useStyletron } from "@mezo-org/mezo-clay"
import type { Address } from "viem"

type AddressLinkProps = {
  address: Address
  label?: string
}

export function AddressLink({ address, label }: AddressLinkProps) {
  const [css, theme] = useStyletron()

  const explorerUrl = `${mezoTestnet.blockExplorers.default.url}/address/${address}`
  const shortAddress = `0x${address.slice(2, 6)}...${address.slice(-4)}`

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={css({
        color: theme.colors.contentPrimary,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: theme.sizing.scale100,
        ":hover": {
          textDecoration: "underline",
        },
      })}
    >
      {label ?? shortAddress}
      <LinkExternal02
        color={theme.colors.contentPrimary}
        size={theme.sizing.scale600}
      />
    </a>
  )
}

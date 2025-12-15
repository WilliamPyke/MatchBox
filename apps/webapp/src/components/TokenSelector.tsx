import { type Token, useCustomToken, useTokenList } from "@/hooks/useTokenList"
import {
  Input,
  LabelSmall,
  ParagraphSmall,
  Select,
  useStyletron,
} from "@mezo-org/mezo-clay"
import { useEffect, useRef, useState } from "react"
import { type Address, isAddress } from "viem"

type TokenSelectorProps = {
  value: Token | undefined
  onChange: (token: Token | undefined) => void
  label?: string
  placeholder?: string
}

const CUSTOM_TOKEN_ID = "__custom__"

export function TokenSelector({
  value,
  onChange,
  label,
  placeholder = "Select a token",
}: TokenSelectorProps) {
  const [css, theme] = useStyletron()
  const { tokens: listTokens, isLoading: isLoadingList } = useTokenList()
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customAddress, setCustomAddress] = useState("")

  // Store onChange in a ref to avoid it being a dependency in useEffect
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const isValidCustomAddress = isAddress(customAddress)
  const { token: customToken, isLoading: isLoadingCustom } = useCustomToken(
    isValidCustomAddress ? (customAddress as Address) : undefined,
  )

  useEffect(() => {
    if (customToken && isCustomMode) {
      onChangeRef.current(customToken)
    }
  }, [customToken, isCustomMode])

  const options = [
    ...listTokens.map((token) => ({
      id: token.address,
      label: `${token.symbol} - ${token.name}`,
    })),
    { id: CUSTOM_TOKEN_ID, label: "Custom token..." },
  ]

  const handleSelectChange = (params: {
    value: readonly { id?: string | number }[]
  }) => {
    const selected = params.value[0]
    if (!selected?.id || typeof selected.id !== "string") {
      onChange(undefined)
      setIsCustomMode(false)
      return
    }

    if (selected.id === CUSTOM_TOKEN_ID) {
      setIsCustomMode(true)
      onChange(undefined)
      return
    }

    setIsCustomMode(false)
    const token = listTokens.find((t) => t.address === selected.id)
    onChange(token)
  }

  const handleCustomAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const address = e.target.value
    setCustomAddress(address)
    if (!isAddress(address)) {
      onChange(undefined)
    }
  }

  const selectedValue = isCustomMode
    ? [{ id: CUSTOM_TOKEN_ID }]
    : value
      ? [{ id: value.address }]
      : []

  return (
    <div>
      {label && (
        <LabelSmall
          color={theme.colors.contentSecondary}
          marginBottom="scale100"
        >
          {label}
        </LabelSmall>
      )}
      <Select
        options={options}
        value={selectedValue}
        onChange={handleSelectChange}
        placeholder={isLoadingList ? "Loading tokens..." : placeholder}
        disabled={isLoadingList}
      />

      {isCustomMode && (
        <div className={css({ marginTop: "12px" })}>
          <LabelSmall
            color={theme.colors.contentSecondary}
            marginBottom="scale100"
          >
            Token Address
          </LabelSmall>
          <Input
            value={customAddress}
            onChange={handleCustomAddressChange}
            placeholder="0x..."
          />
          {customAddress && !isValidCustomAddress && (
            <ParagraphSmall color={theme.colors.negative} marginTop="scale200">
              Invalid address
            </ParagraphSmall>
          )}
          {isValidCustomAddress && isLoadingCustom && (
            <ParagraphSmall
              color={theme.colors.contentSecondary}
              marginTop="scale200"
            >
              Loading token info...
            </ParagraphSmall>
          )}
          {isValidCustomAddress && !isLoadingCustom && !customToken && (
            <ParagraphSmall color={theme.colors.negative} marginTop="scale200">
              Could not load token info. Make sure this is a valid ERC20 token.
            </ParagraphSmall>
          )}
          {customToken && (
            <ParagraphSmall color={theme.colors.positive} marginTop="scale200">
              Found: {customToken.symbol} ({customToken.name})
            </ParagraphSmall>
          )}
        </div>
      )}
    </div>
  )
}

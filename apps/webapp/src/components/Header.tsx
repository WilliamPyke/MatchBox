import { Button, LabelMedium, useStyletron } from "@mezo-org/mezo-clay"
import Image from "next/image"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { injected } from "wagmi/connectors"

export function Header() {
  const [css, theme] = useStyletron()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    connect({ connector: injected() })
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/gauges", label: "Gauges" },
    { href: "/boost", label: "Boost" },
    { href: "/incentives", label: "Incentives" },
  ]

  return (
    <header
      className={css({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: `1px solid ${theme.colors.borderOpaque}`,
        backgroundColor: theme.colors.backgroundPrimary,
      })}
    >
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "32px",
        })}
      >
        <NextLink href="/" style={{ textDecoration: "none" }}>
          <Image src="/logo.png" alt="Matchbox" width={105} height={75} />
        </NextLink>
        <nav
          className={css({
            display: "flex",
            gap: "24px",
          })}
        >
          {navItems.map((item) => (
            <NextLink
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none" }}
            >
              <LabelMedium
                color={
                  router.pathname === item.href
                    ? theme.colors.contentPrimary
                    : theme.colors.contentSecondary
                }
                overrides={{
                  Block: {
                    style: {
                      cursor: "pointer",
                      ":hover": {
                        color: theme.colors.contentPrimary,
                      },
                    },
                  },
                }}
              >
                {item.label}
              </LabelMedium>
            </NextLink>
          ))}
        </nav>
      </div>
      <div>
        {isConnected && address ? (
          <Button kind="secondary" onClick={() => disconnect()}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </Button>
        ) : (
          <Button kind="primary" onClick={handleConnect}>
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  )
}

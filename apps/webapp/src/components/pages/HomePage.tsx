import { Layout } from "@/components/Layout"
import {
  Button,
  Card,
  DisplayLarge,
  ParagraphLarge,
  ParagraphMedium,
  useStyletron,
} from "@mezo-org/mezo-clay"
import Link from "next/link"
import { useAccount } from "wagmi"

export default function HomePage() {
  const [css, theme] = useStyletron()
  const { isConnected } = useAccount()

  return (
    <Layout>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "48px",
          paddingTop: "48px",
        })}
      >
        <div
          className={css({
            textAlign: "center",
            maxWidth: "600px",
          })}
        >
          <DisplayLarge marginBottom="scale600">Matchbox</DisplayLarge>
          <ParagraphLarge color={theme.colors.contentSecondary}>
            Boost your veBTC voting power with veMEZO or attract veMEZO capital
            to your gauge with incentives.
          </ParagraphLarge>
        </div>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            width: "100%",
            maxWidth: "900px",
          })}
        >
          <Card title="veMEZO Holders" withBorder overrides={{}}>
            <div
              className={css({
                padding: "16px 0",
              })}
            >
              <ParagraphMedium
                color={theme.colors.contentSecondary}
                marginBottom="scale500"
              >
                Vote on veBTC gauges to boost their voting power and earn
                incentives in return.
              </ParagraphMedium>
              <Link href="/boost" passHref legacyBehavior>
                <Button kind="primary" $as="a">
                  Vote to Boost
                </Button>
              </Link>
            </div>
          </Card>

          <Card title="veBTC Holders" withBorder overrides={{}}>
            <div
              className={css({
                padding: "16px 0",
              })}
            >
              <ParagraphMedium
                color={theme.colors.contentSecondary}
                marginBottom="scale500"
              >
                Add incentives to your gauge to attract veMEZO votes and boost
                your voting power.
              </ParagraphMedium>
              <Link href="/incentives" passHref legacyBehavior>
                <Button kind="primary" $as="a">
                  Add Incentives
                </Button>
              </Link>
            </div>
          </Card>

          <Card title="Track Performance" withBorder overrides={{}}>
            <div
              className={css({
                padding: "16px 0",
              })}
            >
              <ParagraphMedium
                color={theme.colors.contentSecondary}
                marginBottom="scale500"
              >
                Monitor your boosts, fees earned, and gauge performance over
                time.
              </ParagraphMedium>
              <Link href="/dashboard" passHref legacyBehavior>
                <Button kind="secondary" $as="a">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {!isConnected && (
          <div
            className={css({
              backgroundColor: theme.colors.backgroundSecondary,
              padding: "24px",
              borderRadius: "12px",
              textAlign: "center",
            })}
          >
            <ParagraphMedium color={theme.colors.contentSecondary}>
              Connect your wallet to get started
            </ParagraphMedium>
          </div>
        )}
      </div>
    </Layout>
  )
}

import {
  BOOST_VOTER_ABI,
  CONTRACTS,
  VOTING_ESCROW_ABI,
} from "@repo/shared/contracts"
import { ImageResponse } from "@vercel/og"
import type { NextRequest } from "next/server"
import { http, createPublicClient, formatUnits } from "viem"

export const config = {
  runtime: "edge",
}

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.test.mezo.org/v1"

const client = createPublicClient({
  transport: http(RPC_URL),
})

async function fetchPlatformStats() {
  const contracts = CONTRACTS.testnet

  try {
    const [totalWeight, veMEZOTotalVotingPower, gaugeCount] = await Promise.all(
      [
        client.readContract({
          address: contracts.boostVoter,
          abi: BOOST_VOTER_ABI,
          functionName: "totalWeight",
        }),
        client.readContract({
          address: contracts.veMEZO,
          abi: VOTING_ESCROW_ABI,
          functionName: "totalVotingPower",
        }),
        client.readContract({
          address: contracts.boostVoter,
          abi: BOOST_VOTER_ABI,
          functionName: "length",
        }),
      ],
    )

    return {
      totalVeMEZO: formatNumber(formatUnits(veMEZOTotalVotingPower, 18)),
      totalWeight: formatNumber(formatUnits(totalWeight, 18)),
      totalGauges: Number(gaugeCount).toString(),
    }
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return {
      totalVeMEZO: "—",
      totalWeight: "—",
      totalGauges: "—",
    }
  }
}

function formatNumber(value: string): string {
  const num = Number.parseFloat(value)
  if (Number.isNaN(num)) return "0"
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`
  }
  return num.toFixed(2)
}

export default async function handler(_req: NextRequest) {
  const stats = await fetchPlatformStats()

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        padding: "60px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Logo and Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        <img
          src="https://matchbox.mezo.org/matchbox.png"
          width={60}
          height={60}
          alt="MatchBox"
          style={{ borderRadius: "12px" }}
        />
        <span
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          MatchBox
        </span>
      </div>

      {/* Main Title */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#ffffff",
            margin: "0 0 16px 0",
            lineHeight: 1.1,
          }}
        >
          Boost Your Bitcoin
        </h1>
        <p
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            margin: 0,
          }}
        >
          Maximize your veBTC yield with veMEZO boost voting
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          borderTop: "1px solid #27272a",
          paddingTop: "40px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "16px",
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Total veMEZO Power
          </span>
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#22c55e",
            }}
          >
            {stats.totalVeMEZO}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "16px",
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Total Weight
          </span>
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#3b82f6",
            }}
          >
            {stats.totalWeight}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "16px",
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Active Gauges
          </span>
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#f59e0b",
            }}
          >
            {stats.totalGauges}
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}

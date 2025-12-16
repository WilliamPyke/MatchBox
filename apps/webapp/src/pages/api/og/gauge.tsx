import {
  BOOST_VOTER_ABI,
  CONTRACTS,
  NON_STAKING_GAUGE_ABI,
  VOTING_ESCROW_ABI,
} from "@repo/shared/contracts"
import { createClient } from "@supabase/supabase-js"
import { ImageResponse } from "@vercel/og"
import type { NextRequest } from "next/server"
import { http, type Address, createPublicClient, formatUnits } from "viem"

export const config = {
  runtime: "edge",
}

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.test.mezo.org/v1"

const client = createPublicClient({
  transport: http(RPC_URL),
})

type GaugeProfile = {
  gauge_address: string
  display_name: string | null
  description: string | null
  profile_picture_url: string | null
}

async function fetchGaugeProfile(
  gaugeAddress: string,
): Promise<GaugeProfile | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase
    .from("gauge_profiles")
    .select("gauge_address, display_name, description, profile_picture_url")
    .eq("gauge_address", gaugeAddress.toLowerCase())
    .maybeSingle()

  if (error) {
    console.error("Error fetching gauge profile:", error)
    return null
  }

  return data as GaugeProfile | null
}

type GaugeStats = {
  veBTCWeight: string
  veMEZOWeight: string
  boost: string
  veBTCTokenId: string | null
  isAlive: boolean
}

async function fetchGaugeStats(gaugeAddress: Address): Promise<GaugeStats> {
  const contracts = CONTRACTS.testnet

  try {
    // First batch: get gauge data
    const [totalWeight, isAlive, beneficiary] = await Promise.all([
      client.readContract({
        address: contracts.boostVoter,
        abi: BOOST_VOTER_ABI,
        functionName: "weights",
        args: [gaugeAddress],
      }),
      client.readContract({
        address: contracts.boostVoter,
        abi: BOOST_VOTER_ABI,
        functionName: "isAlive",
        args: [gaugeAddress],
      }),
      client.readContract({
        address: gaugeAddress,
        abi: NON_STAKING_GAUGE_ABI,
        functionName: "rewardsBeneficiary",
      }),
    ])

    let veBTCWeight = "—"
    let boost = "1.00x"
    let veBTCTokenId: string | null = null

    // Get veBTC token ID for this gauge
    if (
      beneficiary &&
      beneficiary !== "0x0000000000000000000000000000000000000000"
    ) {
      const veBTCBalance = await client.readContract({
        address: contracts.veBTC,
        abi: VOTING_ESCROW_ABI,
        functionName: "balanceOf",
        args: [beneficiary],
      })

      if (veBTCBalance > 0n) {
        const tokenId = await client.readContract({
          address: contracts.veBTC,
          abi: VOTING_ESCROW_ABI,
          functionName: "ownerToNFTokenIdList",
          args: [beneficiary, 0n],
        })

        // Verify this token maps to our gauge
        const mappedGauge = await client.readContract({
          address: contracts.boostVoter,
          abi: BOOST_VOTER_ABI,
          functionName: "boostableTokenIdToGauge",
          args: [tokenId],
        })

        if (mappedGauge.toLowerCase() === gaugeAddress.toLowerCase()) {
          veBTCTokenId = tokenId.toString()

          // Get voting power and boost
          const [votingPower, boostValue] = await Promise.all([
            client.readContract({
              address: contracts.veBTC,
              abi: VOTING_ESCROW_ABI,
              functionName: "votingPowerOfNFT",
              args: [tokenId],
            }),
            client.readContract({
              address: contracts.boostVoter,
              abi: BOOST_VOTER_ABI,
              functionName: "getBoost",
              args: [tokenId],
            }),
          ])

          veBTCWeight = formatNumber(formatUnits(votingPower, 18))
          boost = `${(Number(boostValue) / 1e18).toFixed(2)}x`
        }
      }
    }

    return {
      veBTCWeight,
      veMEZOWeight: formatNumber(formatUnits(totalWeight, 18)),
      boost,
      veBTCTokenId,
      isAlive,
    }
  } catch (error) {
    console.error("Error fetching gauge stats:", error)
    return {
      veBTCWeight: "—",
      veMEZOWeight: "—",
      boost: "—",
      veBTCTokenId: null,
      isAlive: false,
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
  return num.toFixed(4)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength - 3)}...`
}

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")

  if (!address) {
    return new Response("Missing address parameter", { status: 400 })
  }

  const gaugeAddress = address as Address
  const [profile, stats] = await Promise.all([
    fetchGaugeProfile(gaugeAddress),
    fetchGaugeStats(gaugeAddress),
  ])

  const displayName =
    profile?.display_name ??
    (stats.veBTCTokenId ? `veBTC #${stats.veBTCTokenId}` : "Gauge")

  const description = profile?.description
    ? truncateText(profile.description, 120)
    : "Boost gauge on MatchBox"

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

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
      {/* Logo Header */}
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
          width={48}
          height={48}
          alt="MatchBox"
          style={{ borderRadius: "10px" }}
        />
        <span
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#a1a1aa",
          }}
        >
          MatchBox
        </span>
      </div>

      {/* Profile Section */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          flex: 1,
          alignItems: "flex-start",
        }}
      >
        {/* Profile Picture */}
        <div
          style={{
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            backgroundColor: "#27272a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "4px solid #3f3f46",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {profile?.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              width={160}
              height={160}
              alt={displayName}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "#71717a",
              }}
            >
              #{stats.veBTCTokenId ?? "?"}
            </span>
          )}
        </div>

        {/* Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <h1
              style={{
                fontSize: "48px",
                fontWeight: 800,
                color: "#ffffff",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {displayName}
            </h1>
            <div
              style={{
                backgroundColor: stats.isAlive ? "#166534" : "#991b1b",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 600,
                padding: "6px 16px",
                borderRadius: "999px",
              }}
            >
              {stats.isAlive ? "Active" : "Inactive"}
            </div>
          </div>

          <span
            style={{
              fontSize: "18px",
              color: "#71717a",
              fontFamily: "monospace",
            }}
          >
            {truncatedAddress}
          </span>

          <p
            style={{
              fontSize: "24px",
              color: "#a1a1aa",
              margin: "16px 0 0 0",
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "flex",
          gap: "60px",
          borderTop: "1px solid #27272a",
          paddingTop: "40px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "14px",
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            veBTC Weight
          </span>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#f59e0b",
            }}
          >
            {stats.veBTCWeight}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "14px",
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            veMEZO Weight
          </span>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#3b82f6",
            }}
          >
            {stats.veMEZOWeight}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "14px",
              color: "#71717a",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Current Boost
          </span>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#22c55e",
            }}
          >
            {stats.boost}
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

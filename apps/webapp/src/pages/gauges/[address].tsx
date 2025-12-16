import { InitialLoader } from "@/components/InitialLoader"
import type { GaugeProfile } from "@/config/supabase"
import { createClient } from "@supabase/supabase-js"
import type { GetServerSideProps } from "next"
import dynamic from "next/dynamic"
import Head from "next/head"

const GaugeDetailPage = dynamic(
  () => import("@/components/pages/GaugeDetailPage"),
  {
    ssr: false,
    loading: () => <InitialLoader />,
  },
)

type GaugePageProps = {
  address: string
  profile: GaugeProfile | null
}

export const getServerSideProps: GetServerSideProps<GaugePageProps> = async (
  context,
) => {
  const address = context.params?.address as string

  if (!address) {
    return {
      notFound: true,
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let profile: GaugeProfile | null = null

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data } = await supabase
      .from("gauge_profiles")
      .select("*")
      .eq("gauge_address", address.toLowerCase())
      .maybeSingle()

    profile = data as GaugeProfile | null
  }

  return {
    props: {
      address,
      profile,
    },
  }
}

export default function GaugeDetail({ address, profile }: GaugePageProps) {
  const displayName = profile?.display_name ?? `Gauge ${address.slice(0, 8)}...`
  const description =
    profile?.description ??
    "View this gauge's boost stats and incentives on MatchBox"

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://matchbox.mezo.org"
  const ogImageUrl = `${baseUrl}/api/og/gauge?address=${address}`
  const pageUrl = `${baseUrl}/gauges/${address}`

  return (
    <>
      <Head>
        <title>{`${displayName} | MatchBox`}</title>
        <meta name="description" content={description} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={`${displayName} | MatchBox`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="MatchBox" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} | MatchBox`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />

        {/* Additional metadata */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
      </Head>
      <GaugeDetailPage />
    </>
  )
}

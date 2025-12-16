import { InitialLoader } from "@/components/InitialLoader"
import dynamic from "next/dynamic"
import Head from "next/head"

const HomePage = dynamic(() => import("@/components/pages/HomePage"), {
  ssr: false,
  loading: () => <InitialLoader />,
})

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matchbox.mezo.org"

export default function Home() {
  const title = "MatchBox | Boost Your Bitcoin"
  const description =
    "Maximize your veBTC yield with veMEZO boost voting on MatchBox"
  const ogImageUrl = `${BASE_URL}/api/og`
  const pageUrl = BASE_URL

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="MatchBox" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />

        {/* Additional metadata */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
      </Head>
      <HomePage />
    </>
  )
}

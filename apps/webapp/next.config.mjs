import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

initOpenNextCloudflareForDev()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/shared"],
  experimental: {
    // Mark packages with workerd-specific exports as external for Cloudflare Workers
    serverComponentsExternalPackages: [
      "viem",
      "isows",
      "uncrypto",
      "@coinbase/cdp-sdk",
    ],
  },
}

export default nextConfig

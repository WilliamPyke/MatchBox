import { wagmiConfig } from "@/config/wagmi"
import { ClayLightTheme, ClayProvider } from "@mezo-org/mezo-clay"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { AppProps } from "next/app"
import { WagmiProvider } from "wagmi"

const queryClient = new QueryClient()

type ClientAppProps = Pick<AppProps, "Component" | "pageProps">

export function ClientApp({ Component, pageProps }: ClientAppProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ClayProvider theme={ClayLightTheme}>
          <Component {...pageProps} />
        </ClayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

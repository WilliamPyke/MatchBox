import { PageLoader } from "@/components/PageLoader"
import dynamic from "next/dynamic"

const GaugesPage = dynamic(() => import("@/components/pages/GaugesPage"), {
  ssr: false,
  loading: () => <PageLoader />,
})

export default function Gauges() {
  return <GaugesPage />
}

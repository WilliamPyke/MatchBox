import { PageLoader } from "@/components/PageLoader"
import dynamic from "next/dynamic"

const BoostPage = dynamic(() => import("@/components/pages/BoostPage"), {
  ssr: false,
  loading: () => <PageLoader />,
})

export default function Boost() {
  return <BoostPage />
}

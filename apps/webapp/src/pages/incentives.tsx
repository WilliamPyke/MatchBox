import { PageLoader } from "@/components/PageLoader"
import dynamic from "next/dynamic"

const IncentivesPage = dynamic(
  () => import("@/components/pages/IncentivesPage"),
  {
    ssr: false,
    loading: () => <PageLoader />,
  },
)

export default function Incentives() {
  return <IncentivesPage />
}

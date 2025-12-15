import { PageLoader } from "@/components/PageLoader"
import dynamic from "next/dynamic"

const DashboardPage = dynamic(
  () => import("@/components/pages/DashboardPage"),
  {
    ssr: false,
    loading: () => <PageLoader />,
  },
)

export default function Dashboard() {
  return <DashboardPage />
}

import { PageLoader } from "@/components/PageLoader"
import dynamic from "next/dynamic"

const HomePage = dynamic(() => import("@/components/pages/HomePage"), {
  ssr: false,
  loading: () => <PageLoader />,
})

export default function Home() {
  return <HomePage />
}

import { useStyletron } from "@mezo-org/mezo-clay"
import type { ReactNode } from "react"
import { Header } from "./Header"

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [css, theme] = useStyletron()

  return (
    <div
      className={css({
        minHeight: "100vh",
        backgroundColor: theme.colors.backgroundPrimary,
      })}
    >
      <Header />
      <main
        className={css({
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px",
        })}
      >
        {children}
      </main>
    </div>
  )
}

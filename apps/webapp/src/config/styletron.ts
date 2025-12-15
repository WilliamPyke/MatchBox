// Styletron is handled by the shared engine between ClayProvider and baseui
// This file provides a singleton Client engine for client-side usage

import { Client } from "styletron-engine-monolithic"

// Only create the engine on the client side
export const styletron =
  typeof window !== "undefined" ? new Client() : ({} as Client)

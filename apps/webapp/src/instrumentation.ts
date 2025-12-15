export async function register() {
  // Polyfill document for SSR (needed for @mezo-org/mezo-clay)
  if (typeof document === "undefined") {
    ;(global as Record<string, unknown>).document = {
      getElementsByClassName: () => [],
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        appendChild: () => {},
        removeChild: () => {},
        insertBefore: () => {},
      }),
      head: {
        appendChild: () => {},
        insertBefore: () => {},
        removeChild: () => {},
      },
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createTextNode: () => ({}),
      documentElement: {
        style: {},
      },
    }
  }
}

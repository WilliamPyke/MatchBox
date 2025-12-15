import { FixedPointNumber } from "@thesis-co/cent"

/**
 * Format a bigint value as a fixed-point number with the specified decimals.
 * Uses @thesis-co/cent for precise fixed-point math.
 * Truncates to 4 significant digits and drops trailing zeros.
 */
export function formatFixedPoint(value: bigint, decimals = 18n): string {
  if (value === 0n) {
    return "0"
  }

  try {
    const fp = new FixedPointNumber(value, decimals)
    return fp.toPrecision(4n).toString({ trailingZeroes: false })
  } catch (error) {
    // Log debug info for unexpected errors
    console.error("formatFixedPoint error:", {
      value: value.toString(),
      decimals: decimals.toString(),
      error,
    })
    // Fallback: show raw value divided by decimals as approximate
    const divisor = 10n ** decimals
    if (value < divisor) {
      return "<0.0001"
    }
    return (value / divisor).toString()
  }
}

/**
 * Format a boost multiplier (stored as 18-decimal fixed-point) for display.
 */
export function formatBoostMultiplier(boost: bigint | undefined): string {
  if (boost === undefined) return "1.00x"
  const multiplier = Number(boost) / 1e18
  return `${multiplier.toFixed(2)}x`
}

/**
 * Format a number as a boost multiplier for display.
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(2)}x`
}

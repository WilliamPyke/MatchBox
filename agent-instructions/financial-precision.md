### Financial Precision Guidelines

- **NEVER** use `parseFloat()`, `Number()`, or `toFixed()` with financial values
- Use utilities from `@thesis-co/cent`, including `Money()` for currency amounts
  and calculations, and `FixedPoint()` for precise decimal arithmetic
- Avoid `.toNumber()` calls except when absolutely necessary (e.g., simple integer counts)
- Use `Money.toString()` with formatting options for display instead of manual formatting
- For exchange rates, use `ExchangeRate.average()` for multi-source calculations
- In new database tables, store amounts as `DECIMAL` and currencies by their ISO-4217 code ("USD", "ARS") or their commonly used cryptocurrency ticker ("BTC", "ETH")
  - Always store financial amounts in the base asset ("USD") rather than the fractional unit ("cents").
  - Ensure `DECIMAL` columns have enough precision to store the smallest unit of the currency.
- **ALWAYS** cast DECIMAL database columns to `::text` in Supabase queries to prevent precision loss
  - Example: `amount::text`, `price::text`, `balance::text`
  - The Supabase client converts DECIMAL to JavaScript number by default, losing precision
- Example patterns:

  ```typescript
  // ✅ Good - preserves precision throughout
  const amount = Money("USD 123.45")
  const result = amount.multiply("1.03")
  const display = result.toString({ compact: true })

  // ❌ Bad - loses precision
  const amount = parseFloat("123.45")
  const result = amount * 1.03
  const display = result.toFixed(2)

  // ✅ Good - cast DECIMAL columns to text in queries
  const { data } = await supabase.from("orders").select("*, total_amount::text")

  // ❌ Bad - DECIMAL becomes JavaScript number
  const { data } = await supabase.from("orders").select("*") // total_amount loses precision
  ```

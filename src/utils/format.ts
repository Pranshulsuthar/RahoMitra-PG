/** Format an amount as Indian Rupees: 9500 -> "₹9,500" */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/** Format a rent value with a "/month" suffix. */
export function formatRent(amount: number): string {
  return `${formatINR(amount)}/month`
}

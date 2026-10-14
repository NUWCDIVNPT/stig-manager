/** Zero or missing counts render as '-' so tallies of nothing read as blank. */
export function dashZero(value) {
  return value == null || value === 0 ? '-' : value
}

/** Zero or missing counts render as '-' so tallies of nothing read as blank. */
export function dashZero(value) {
  return value === 0 || value === null || value === undefined ? '-' : value
}

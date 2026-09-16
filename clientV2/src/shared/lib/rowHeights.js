import { remToPx } from './remToPx.js'

// Virtual scroller row heights, in rem of the root font-size. Every fixed-size
// scroller picks one of these instead of a bespoke number, so the set of row
// heights in the client stays small and a root font-size change scales them all.
// Pick the smallest token whose height fits the tallest thing in the row; rows
// are pinned to itemSize with overflow hidden, so too small clips content.
export const ROW_HEIGHT_REM = {
  // Pinned rows with zero cell padding: text, checkbox, 2rem icon buttons.
  dense: 2.5,
  // One text line with compact option or cell padding.
  compact: 2.75,
  // One text line with default cell padding, or a badge or 2rem button.
  standard: 3.5,
  // One line holding an inline Select or a 32px action button.
  control: 3.75,
  // One text line in an unstyled Material DataTable (0.75rem cell padding).
  spacious: 4.25,
  // Primary text over secondary text.
  twoLine: 4.5,
  // Benchmark card: clamped title, id row and meta row.
  card: 8.5,
}

// Px height for a virtual scroller itemSize. Call at component setup, once the
// root stylesheet is applied; the value is fixed for the life of the component.
export function rowHeightPx(kind) {
  const rem = ROW_HEIGHT_REM[kind]
  if (rem === undefined) {
    throw new Error(`rowHeightPx: unknown row height "${kind}"`)
  }
  return remToPx(rem)
}

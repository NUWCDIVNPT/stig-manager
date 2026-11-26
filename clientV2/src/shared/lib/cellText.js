// Review text as a line-clamped grid cell (ReviewTextCell) shows it. The cell
// keeps line breaks (white-space: pre-wrap), so every blank line would use up
// one of the few clamped lines and a leading one would leave the cell looking
// empty. Blank
// lines and leading whitespace are dropped; indentation after the first line
// is kept. For display only: tooltips, editors and exports take the text as is.
export function compactCellText(text) {
  if (text == null) {
    return ''
  }
  return String(text)
    .split(/\r\n|\r|\n/)
    .map(line => line.trimEnd())
    .filter(Boolean)
    .join('\n')
    .trimStart()
}

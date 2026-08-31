// Extracts the filename from a Content-Disposition header, or null when the
// header is absent or carries no usable name.
//
// Forms handled, in RFC 6266 preference order:
//   1. filename*=charset''percent-encoded — percent-decoded per RFC 5987
//   2. filename="..." (or '...')          — taken literally: a quoted string
//      is not percent-encoded, so a literal % must survive undecoded
//   3. filename=token                     — bare, ends at the next ;
//
// The STIG Manager API emits form 2 with only OS-reserved characters escaped
// (see api/source/utils/escape.js), so quote characters never appear inside
// the name but apostrophes and semicolons can — the capture must run to the
// closing quote, not stop at the first ' or ;.
export function filenameFromContentDisposition(header) {
  if (!header) {
    return null
  }

  const extended = header.match(/filename\*\s*=\s*[^']*'[^']*'([^;\r\n]+)/i)
  if (extended) {
    try {
      const decoded = decodeURIComponent(extended[1].trim())
      if (decoded) {
        return decoded
      }
    }
    catch {
      // Malformed percent-encoding — fall through to the plain forms.
    }
  }

  const doubleQuoted = header.match(/filename\s*=\s*"([^"\r\n]*)"/i)
  if (doubleQuoted) {
    return doubleQuoted[1] || null
  }
  const singleQuoted = header.match(/filename\s*=\s*'([^'\r\n]*)'/i)
  if (singleQuoted) {
    return singleQuoted[1] || null
  }

  const bare = header.match(/filename\s*=\s*([^;\r\n]+)/i)
  if (bare) {
    return bare[1].trim().replace(/^["']+|["']+$/g, '') || null
  }

  return null
}

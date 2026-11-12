import { formatDateTimeString } from '../lib.js'

const TOKEN_DATE_CLAIMS = ['exp', 'iat', 'auth_time', 'nbf']

/**
 * Returns the token's claims with a readable date appended to each
 * epoch-second claim (exp, iat, ...), as in the legacy client.
 * The token payload passed in is not modified.
 */
export function tokenClaimsWithDates(tokenParsed) {
  const claims = { ...tokenParsed }
  for (const claim of TOKEN_DATE_CLAIMS) {
    if (typeof claims[claim] === 'number') {
      claims[claim] = `${claims[claim]} (${formatDateTimeString(claims[claim] * 1000)})`
    }
  }
  return claims
}

/**
 * Defaults and normalization for a collection's review import options.
 *
 * The Import Options template binds nested `importOptions` paths directly, so
 * every key must exist. Legacy payloads also stored `autoStatus` as a single
 * string applied to all results; `normalizeImportOptions` expands that into the
 * per-result object the UI expects.
 */

export const defaultImportOptions = {
  autoStatus: { fail: 'saved', notapplicable: 'saved', pass: 'saved' },
  unreviewed: 'commented',
  unreviewedCommented: 'informational',
  emptyDetail: 'replace',
  emptyComment: 'ignore',
  updateAssetProps: false,
  allowCustom: true,
}

export function normalizeImportOptions(options) {
  const opts = { ...defaultImportOptions, ...options }
  opts.autoStatus = typeof opts.autoStatus === 'string'
    ? { fail: opts.autoStatus, notapplicable: opts.autoStatus, pass: opts.autoStatus }
    : { ...defaultImportOptions.autoStatus, ...opts.autoStatus }
  return opts
}

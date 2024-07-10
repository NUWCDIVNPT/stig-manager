

/**
 * Escapes XML reserved characters with named entity references.
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string.
 */
module.exports.escapeForXml = function (name, value) {
  /**
   * Regex matches characters that need to be escaped in XML.
   * @type {RegExp}
   */
  const regexEscapeXml = /["&'<>]/g

  /**
   * Map of characters to their corresponding named XML entities.
   * @type {Object.<string, string>}
   */
  const escapeMapXml = {
    '"': '&quot;',
    '&': '&amp;',
    '\'': '&apos;',
    '<': '&lt;',
    '>': '&gt;'
  }
  return value.toString().replace(regexEscapeXml, function ($0) {
    return escapeMapXml[$0]
  })
}

/**
 * Escapes filesystem reserved characters with named entity references.
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string.
 */
module.exports.escapeFilename = function (value) {
  /**
   * Regexes match characters that need to be escaped in filenames.
   * @type {RegExp}
   */
  const osReserved = /[/\\:*"?<>|]/g
  const controlChars = /[\x00-\x1f]/g

    /**
   * Map of characters to their corresponding named HTML entities.
   * @type {Object.<string, string>}
   */
  const osReserveReplace = {
    '/': '&sol;',
    '\\': '&bsol;',
    ':': '&colon;',
    '*': '&ast;',
    '"': '&quot;',
    '?': '&quest;',
    '<': '&lt;',
    '>': '&gt;',
    '|': '&vert;',
  }

  return value.toString()
  .replace(osReserved, (match) => osReserveReplace[match])
  .replace(controlChars, (match) => `&#x${match.charCodeAt(0).toString().padStart(2,'0')};`)
  .substring(0, 255)
}

module.exports.filenameComponentFromDate = function (dateObject = new Date()) {
  return dateObject.toISOString().replace(/:|\d{2}\.\d{3}/g,'')
}


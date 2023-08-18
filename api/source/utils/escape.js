

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
};

/**
 * Escapes XML reserved characters with named entity references.
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string.
 */
module.exports.escapeForXml = function(name, value) {
  return value.toString().replace(regexEscapeXml, function($0) {
    return escapeMapXml[$0]
  });
}


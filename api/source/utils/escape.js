

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

/**
 * Classification level hierarchy for determining highest classification
 * Higher numbers represent higher classification levels
 */
const classificationLevels = {
  'NONE': 0,
  'U': 1,
  'CUI': 2,
  'C': 3,
  'S': 4,
  'TS': 5,
  'SCI': 6
}

/**
 * Determines the highest classification level from an array of classifications
 * @param {Array<string>} classifications - Array of classification strings
 * @returns {string|null} The highest classification level or null if no valid classifications
 */
module.exports.getHighestClassification = function (classifications) {
  if (!Array.isArray(classifications) || classifications.length === 0) {
    return null
  }
  
  const validClassifications = classifications.filter(c => c && classificationLevels.hasOwnProperty(c))
  if (validClassifications.length === 0) {
    return null
  }
  
  return validClassifications.reduce((highest, current) => {
    return classificationLevels[current] > classificationLevels[highest] ? current : highest
  })
}

/**
 * Adds classification to filename if provided
 * @param {string} baseFilename - The base filename without classification
 * @param {string} classification - The classification level
 * @param {string} dateString - The date string
 * @param {string} extension - The file extension
 * @returns {string} The filename with classification included
 */
module.exports.addClassificationToFilename = function (baseFilename, classification, dateString, extension) {
  if (classification && classification !== 'NONE') {
    return `${baseFilename}_${classification}_${dateString}.${extension}`
  }
  return `${baseFilename}_${dateString}.${extension}`
}


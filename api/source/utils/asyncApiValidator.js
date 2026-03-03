/**
 * Lightweight AsyncAPI 3.0 message validator.
 *
 * Builds AJV-compiled validators from an AsyncAPI 3.0 YAML spec file.
 * Provides a validate(key, payload, channel, operation) method for runtime
 * message validation on any channel defined in the spec.
 *
 * Parser limitations (not AsyncAPI requirements — these are constraints of this
 * module's simplified parsing approach):
 * - Only handles AsyncAPI 3.0 (not 2.x, which has a different structure)
 * - Spec must be a single YAML file (no external file $ref references)
 * - Circular $ref references will throw an error (detected via visited set)
 * - $ref pointers are only resolved within components/schemas
 * - Each message must have a `name` field (AsyncAPI makes this optional; we
 *   use it as the validation lookup key, same role as asyncapi-validator's
 *   msgIdentifier option)
 * - Message payloads must use a $ref to components/schemas (inline schemas
 *   are not supported)
 * - Operations must include a `messages` array (AsyncAPI makes this optional,
 *   defaulting to all channel messages; we require it to be explicit)
 *
 * Background:
 * Replaces the asyncapi-validator npm package, which was removed because its
 * dependency chain (asyncapi-validator -> @asyncapi/parser -> @stoplight/spectral-core
 * -> minimatch@3.1.2) included a version of minimatch vulnerable to CVE-2026-27904
 * (catastrophic regex backtracking). The asyncapi-validator package was not receiving
 * regular updates, and all alternative AsyncAPI message validation packages
 * (e.g., asyncapi-validation) also depend on @asyncapi/parser, so they would
 * introduce the same vulnerability.
 *
 * Why js-yaml instead of @asyncapi/parser:
 * @asyncapi/parser is a full-featured AsyncAPI spec parser that validates the spec
 * itself, resolves multi-file $ref chains, handles protocol bindings, and produces
 * a rich document model. Our specs are single self-contained files with only
 * intra-file $ref references and simple JSON schemas. js-yaml gives us the parsed
 * YAML object, and we resolve the $ref chains ourselves in ~15 lines. This
 * eliminates the entire @asyncapi/parser dependency tree (~160 packages) while
 * preserving identical validation behavior.
 *
 * Spec validation:
 * This module does not validate that the YAML file is a valid AsyncAPI document.
 * It trusts the spec structure. To validate a spec against the AsyncAPI schema,
 * use the AsyncAPI CLI (also enforced in CI via api-spec-validation.yml):
 *   npx @asyncapi/cli validate api/source/specification/log-socket.yaml
 */

const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const fs = require('node:fs')
const jsYaml = require('js-yaml')

class AsyncApiValidator {
  constructor(channels, ajv) {
    this._channels = channels
    this._ajv = ajv
  }

  /**
   * Validate a message payload against the schema defined in the AsyncAPI spec.
   * @param {string} key - Message name as defined in the spec (e.g., 'authorize', 'log')
   * @param {object} payload - The message object to validate
   * @param {string} channel - Channel name (e.g., 'logStream')
   * @param {string} operation - 'send' or 'receive'
   * @throws {Error} if validation fails or the key/channel/operation is not found
   */
  validate(key, payload, channel, operation) {
    const channelDef = this._channels[channel]
    if (!channelDef) {
      throw new Error(`channel "${channel}" not found`)
    }
    const operationDef = channelDef[operation]
    if (!operationDef) {
      throw new Error(`operation "${operation}" not found on channel "${channel}"`)
    }
    const validateFn = operationDef[key]
    if (!validateFn) {
      throw new Error(`message "${key}" on channel "${channel}" operation "${operation}" not found`)
    }
    const valid = validateFn(payload)
    if (!valid) {
      throw new Error(this._ajv.errorsText(validateFn.errors))
    }
    return true
  }
}

/**
 * Recursively resolve $ref pointers within a JSON Schema object.
 * Only handles intra-file references to components/schemas.
 * Tracks visited refs to detect circular references.
 */
function resolveRefs(node, schemas, visited = new Set()) {
  if (!node || typeof node !== 'object') return node
  if (node.$ref) {
    const refName = node.$ref.split('/').pop()
    if (visited.has(refName)) {
      throw new Error(`Circular $ref detected: ${refName}`)
    }
    if (!schemas[refName]) {
      throw new Error(`Dangling $ref: "${node.$ref}" not found in components/schemas`)
    }
    return resolveRefs(schemas[refName], schemas, new Set(visited).add(refName))
  }
  if (Array.isArray(node)) {
    return node.map(item => resolveRefs(item, schemas, visited))
  }
  const resolved = {}
  for (const [key, value] of Object.entries(node)) {
    resolved[key] = resolveRefs(value, schemas, visited)
  }
  return resolved
}

/**
 * Build an AsyncApiValidator from an AsyncAPI 3.0 YAML spec file.
 * Parses the spec, resolves $ref chains, and pre-compiles AJV validators
 * for each message type grouped by channel and operation (send/receive).
 *
 * Messages are keyed by their `name` field in the spec. See the module-level
 * JSDoc for full spec requirements.
 *
 * @param {string} schemaPath - Absolute path to the AsyncAPI YAML file
 * @returns {AsyncApiValidator}
 */
function fromSource(schemaPath) {
  const yamlContent = fs.readFileSync(schemaPath, 'utf8')
  const spec = jsYaml.load(yamlContent)

  const ajv = new Ajv({ allErrors: true, strict: false, unicodeRegExp: false })
  addFormats(ajv)

  const schemas = spec.components.schemas
  const messages = spec.components.messages
  const channels = {}

  for (const operation of Object.values(spec.operations)) {
    const channelName = operation.channel.$ref.split('/').pop()
    const action = operation.action

    for (const msgRefObj of operation.messages) {
      // Resolve through channels to components/messages
      const refParts = msgRefObj.$ref.split('/')
      // e.g., '#/channels/logStream/messages/AuthorizeResponse'
      const channelMsgEntry = spec.channels[refParts[2]].messages[refParts[4]]
      const componentMsgName = channelMsgEntry.$ref.split('/').pop()
      const message = messages[componentMsgName]
      const msgKey = message.name
      const schemaName = message.payload.$ref.split('/').pop()
      const payloadSchema = resolveRefs(schemas[schemaName], schemas)

      const validateFn = ajv.compile(payloadSchema)

      channels[channelName] ??= {}
      channels[channelName][action] ??= {}
      channels[channelName][action][msgKey] = validateFn
    }
  }

  return new AsyncApiValidator(channels, ajv)
}

module.exports = { fromSource }

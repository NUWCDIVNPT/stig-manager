import { dereferenceSync } from '@trojs/openapi-dereference'

class OpenApiOps {
  /**
   * A Class for working with an OAS definition by operationId.
   * 
   * @param {Object} options - the options for the instance.
   * @property {string} options.definition - the OAS definition as a JS Object.
   * @property {string} [options.apiBase] - the URL prefix for the URL generators, by default will be taken from the definition
   */
  constructor({ apiBase, definition}) {
    this.definition = definition
    this.apiBase = apiBase || definition.servers?.[0]?.url
    /** @type {Map<string,{path, method, params}>} */
    this.operationMap = this.#buildOperationIdMap(this.definition)
  }
  /**
   * Creates and populates an operationMap from an OAS definition
   * 
   * @param {Object} definition parsed JSON of the OAS definition
   * @returns {Map<string,{path, method, params}>}
   */
  #buildOperationIdMap(definition) {
    // buggy module requires double de-referencing to reach our depths
    const oasDeref = dereferenceSync(definition)
    const operationMap = new Map()
    const operations = ['get', 'post', 'patch', 'put', 'delete']
    const paths = oasDeref.paths
    for (const [pathKey, pathValue] of Object.entries(paths)) {
      const commonParams = {}
      for (const [key, value] of Object.entries(pathValue)) {
        // handle the parameters defined for all operations under the path
        if (key === 'parameters') {
          value.reduce((a, v) => { a[v.name] = v; return a }, commonParams)
        }
        // handle an operation key
        if (operations.includes(key)) {
          // clone the common parameters
          const opParams = { ...commonParams }
          // add the operation defined parameters, if any
          value.parameters?.reduce((a, v) => { a[v.name] = v; return a }, opParams)
          operationMap.set(value.operationId, {
            path: pathKey,
            method: key,
            params: opParams,
          })
        }
      }
    }
    return operationMap
  }

  /**
   * For a given operationId and parameters, generate the URL
   * 
   * @param {string} operationId 
   * @param {Object} params
   * @returns {string}
   */
  getUrl(operationId, inParams = {}) {
    // clone the params argument so we don't mutate it
    const params = { ...inParams }

    // get the operationId from the map
    const op = this.operationMap.get(operationId)

    // throw if the operationId is not defined
    if (!op) throw new Error('unknown operationId')

    // remove params which are not defined for the operationId
    for (const param in params) {
      if (!op.params[param]) {
        // throw new Error(`parameter ${param} not defined for ${operationId}`)
        delete params[param]
      }
    }

    // substitute the path params, deleting from params, throwing if one is missing
    const path = op.path.replace(/{(\w+)}/g, (template, key) => {
      if (params[key] === undefined) {
        throw new Error(`path requires parameter ${template}`)
      }
      delete params[key]
      return inParams[key]
    })

    // create URL from our base and the path with substitutions
    const urlObj = new URL(`${this.apiBase}${path}`)

    // append remaining params as query params
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        // Use form/explode style for array query params
        for (const item of value) {
          urlObj.searchParams.append(key, item)
        }
      }
      else {
        urlObj.searchParams.append(key, value)
      }
    }
    return urlObj.toString()
  }

  /**
   * For a given operationId, generates a list of URLs with each possible projection and all of them.
   *
   * @method getProjectedUrls
   * @param {string} operationId - The identifier for the operation to retrieve projections.
   * @param {Object} inParams - The input parameters to be used for generating URLs.
   * @param {string} [inParams.projection] - The projection parameter (not allowed in this method).
   * @throws {Error} If the `projection` parameter is provided in `inParams`.
   * @throws {Error} If no projections are available for the given `operationId`.
   * @returns {string[]} An array of URLs with different projections for the given operation.
   */
  getProjectedUrls(operationId, inParams) {
    // iteration: maybe handle this silently?
    if (inParams.projection) throw new Error('projection parameter not allowed')
    // clone the params argument so we don't mutate it
    const params = { ...inParams }
    const projections = this.operationMap.get(operationId)?.params.projection?.schema?.items?.enum
    // iterate: maybe allow and just output a single url without projections?
    if (!projections) throw new Error(`no projections for operationId ${operationId}`)

    const urls = []
    // a url for each projection
    for (const projection of projections) {
      params.projection = projection
      urls.push(this.getUrl(operationId, params))
    }
    // a url with all the projections
    params.projection = projections
    urls.push(this.getUrl(operationId, params))
    return urls
  }

  /**
   * Retrieves a list of operation IDs that match the provided criteria.
   *
   * @method getOperationIds
   * @param {Object} [options={}] - The options for filtering operation IDs.
   * @param {string} [options.path] - The path to match in the operation's value.
   * @param {string} [options.method] - The HTTP method to match in the operation's value.
   * @param {string|null} [options.param] - The name of a parameter to match. If `null`, matches operations with no parameters.
   * @param {string} [options.paramIn] - The location of the parameter (e.g., "query", "path") to match. Used only if `param` is provided.
   * @param {string|null} [options.projection] - A specific projection to match. If `null`, matches operations with no `projection` parameter.
   * @returns {string[]} An array of operation IDs that match the provided criteria.
   */
  getOperationIds({ path, method, param, paramIn, projection } = {}) {
    const operationIds = []
    for (const [operationId, value] of this.operationMap) {
      const matches = [true] // Start with an initial match of `true`
      
      if (path)
        matches.push(value.path.includes(path))
      if (method)
        matches.push(value.method === method)
      if (param === null)
        matches.push(Object.keys(value.params).length === 0)
      if (param)
        matches.push(param in value.params && (paramIn ? value.params[param]?.in === paramIn : true))
      if (projection === null)
        matches.push(!value.params.projection)
      if (projection)
        matches.push(value.params.projection?.schema?.items?.enum.includes(projection))

      if (matches.every(v => v)) {
        operationIds.push(operationId)
      }
    }
    return operationIds
  }
}

export { OpenApiOps }
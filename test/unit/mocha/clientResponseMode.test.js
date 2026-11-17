import { expect } from 'chai'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const configPath = require.resolve('../../../api/source/utils/config.js')

function loadConfig(env) {
  const saved = process.env.STIGMAN_CLIENT_RESPONSE_MODE
  delete process.env.STIGMAN_CLIENT_RESPONSE_MODE
  Object.assign(process.env, env)
  const cached = require.cache[configPath]
  delete require.cache[configPath]
  try {
    return require(configPath)
  }
  finally {
    if (cached) { require.cache[configPath] = cached }
    else { delete require.cache[configPath] }
    if (saved === undefined) { delete process.env.STIGMAN_CLIENT_RESPONSE_MODE }
    else { process.env.STIGMAN_CLIENT_RESPONSE_MODE = saved }
  }
}

describe('client.responseMode config', () => {
  it('is query when the variable is not set', () => {
    expect(loadConfig({}).client.responseMode).to.equal('query')
  })

  it('ignores STIGMAN_CLIENT_RESPONSE_MODE', () => {
    const config = loadConfig({ STIGMAN_CLIENT_RESPONSE_MODE: 'fragment' })
    expect(config.client.responseMode).to.equal('query')
  })
})

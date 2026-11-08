import { expect } from 'chai'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const configPath = require.resolve('../../../api/source/utils/config.js')

function loadConfig(env) {
  const saved = {
    STIGMAN_CLIENT_HISTORY_BASE: process.env.STIGMAN_CLIENT_HISTORY_BASE,
    STIGMAN_CLIENT_PATH_PREFIX: process.env.STIGMAN_CLIENT_PATH_PREFIX,
  }
  delete process.env.STIGMAN_CLIENT_HISTORY_BASE
  delete process.env.STIGMAN_CLIENT_PATH_PREFIX
  Object.assign(process.env, env)
  const cached = require.cache[configPath]
  delete require.cache[configPath]
  try {
    return require(configPath)
  }
  finally {
    if (cached) { require.cache[configPath] = cached }
    else { delete require.cache[configPath] }
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) { delete process.env[key] }
      else { process.env[key] = value }
    }
  }
}

describe('client.historyBase config', () => {
  it('is empty when the variable is not set', () => {
    expect(loadConfig({}).client.historyBase).to.equal('')
  })

  it('keeps a value that ends with a slash', () => {
    const config = loadConfig({ STIGMAN_CLIENT_HISTORY_BASE: '/stigman/' })
    expect(config.client.historyBase).to.equal('/stigman/')
  })

  it('adds a missing trailing slash', () => {
    const config = loadConfig({ STIGMAN_CLIENT_HISTORY_BASE: '/stigman' })
    expect(config.client.historyBase).to.equal('/stigman/')
  })

  it('accepts the origin root', () => {
    const config = loadConfig({ STIGMAN_CLIENT_HISTORY_BASE: '/' })
    expect(config.client.historyBase).to.equal('/')
  })

  it('ignores the former variable name', () => {
    const config = loadConfig({ STIGMAN_CLIENT_PATH_PREFIX: '/stigman/' })
    expect(config.client.historyBase).to.equal('')
    expect(config.client).to.not.have.property('pathPrefix')
  })
})

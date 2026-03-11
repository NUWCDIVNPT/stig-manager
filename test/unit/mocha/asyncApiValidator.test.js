import { expect } from 'chai'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const specPath = path.resolve(__dirname, '../../../api/source/specification/log-socket.yaml')

// CJS module imported into ESM — default import gets module.exports
import asyncApiValidator from '../../../api/source/utils/asyncApiValidator.js'

// Minimal valid spec template for structural tests.
// Returns a JSON string (valid YAML since YAML is a superset of JSON).
function minimalSpec(overrides = {}) {
  return JSON.stringify({
    asyncapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    channels: {
      testChannel: {
        messages: {
          TestMessage: { $ref: '#/components/messages/TestMessage' }
        }
      }
    },
    operations: {
      testOp: {
        action: 'send',
        channel: { $ref: '#/channels/testChannel' },
        messages: [{ $ref: '#/channels/testChannel/messages/TestMessage' }]
      }
    },
    components: {
      messages: {
        TestMessage: {
          name: 'test',
          payload: { $ref: '#/components/schemas/TestPayload' }
        }
      },
      schemas: {
        TestPayload: {
          type: 'object',
          properties: {
            type: { const: 'test' }
          }
        }
      }
    },
    ...overrides
  })
}

describe('asyncApiValidator', function () {
  const tmpFiles = []

  afterEach(function () {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f) } catch {}
    }
    tmpFiles.length = 0
  })

  function tempSpec(content) {
    const tmpPath = path.join(os.tmpdir(), `asyncapi-test-${Date.now()}-${Math.random().toString(36).slice(2)}.yaml`)
    fs.writeFileSync(tmpPath, content, 'utf8')
    tmpFiles.push(tmpPath)
    return tmpPath
  }

  describe('fromSource - real spec', function () {
    it('should load log-socket.yaml and return a validator', function () {
      const validator = asyncApiValidator.fromSource(specPath)
      expect(validator).to.be.an('object')
      expect(validator.validate).to.be.a('function')
    })
  })

  describe('fromSource - $ref resolution', function () {
    it('should throw on circular $ref between schemas', function () {
      const spec = JSON.parse(minimalSpec())
      spec.components.schemas.TestPayload = {
        type: 'object',
        properties: {
          child: { $ref: '#/components/schemas/CircularB' }
        }
      }
      spec.components.schemas.CircularB = {
        type: 'object',
        properties: {
          parent: { $ref: '#/components/schemas/TestPayload' }
        }
      }
      const p = tempSpec(JSON.stringify(spec))
      expect(() => asyncApiValidator.fromSource(p)).to.throw('Circular $ref detected')
    })

    it('should throw on dangling $ref in schema', function () {
      const spec = JSON.parse(minimalSpec())
      spec.components.schemas.TestPayload = {
        type: 'object',
        properties: {
          child: { $ref: '#/components/schemas/DoesNotExist' }
        }
      }
      const p = tempSpec(JSON.stringify(spec))
      expect(() => asyncApiValidator.fromSource(p)).to.throw('Dangling $ref')
    })
  })

  describe('validate - all message types registered', function () {
    let validator

    before(function () {
      validator = asyncApiValidator.fromSource(specPath)
    })

    const sendMessages = [
      ['authorize', { type: 'authorize', data: { state: 'unauthorized' } }],
      ['log', { type: 'log', data: { timestamp: '2025-01-01' } }],
      ['error', { type: 'error', data: 'something went wrong' }],
      ['info', { type: 'info', data: { success: true } }],
      ['close', { type: 'close', data: 'goodbye' }]
    ]

    const receiveMessages = [
      ['authorize', { type: 'authorize', data: { token: 'abc' } }],
      ['command', { type: 'command', data: { command: 'stream-start' } }]
    ]

    for (const [name, payload] of sendMessages) {
      it(`should have send message type "${name}" registered`, function () {
        expect(() => validator.validate(name, payload, 'logStream', 'send')).to.not.throw()
      })
    }

    for (const [name, payload] of receiveMessages) {
      it(`should have receive message type "${name}" registered`, function () {
        expect(() => validator.validate(name, payload, 'logStream', 'receive')).to.not.throw()
      })
    }
  })

  describe('validate - accepts valid payloads', function () {
    let validator

    before(function () {
      validator = asyncApiValidator.fromSource(specPath)
    })

    it('should accept authorize receive with token', function () {
      expect(() => validator.validate('authorize', { type: 'authorize', data: { token: 'jwt.token.here' } }, 'logStream', 'receive')).to.not.throw()
    })

    it('should accept command receive with stream-start', function () {
      expect(() => validator.validate('command', { type: 'command', data: { command: 'stream-start' } }, 'logStream', 'receive')).to.not.throw()
    })

    it('should accept command receive with stream-start and filter', function () {
      const payload = { type: 'command', data: { command: 'stream-start', filter: { level: [1, 2], component: ['rest'] } } }
      expect(() => validator.validate('command', payload, 'logStream', 'receive')).to.not.throw()
    })

    it('should accept command receive with stream-stop', function () {
      expect(() => validator.validate('command', { type: 'command', data: { command: 'stream-stop' } }, 'logStream', 'receive')).to.not.throw()
    })

    it('should accept authorize send with state', function () {
      expect(() => validator.validate('authorize', { type: 'authorize', data: { state: 'authorized' } }, 'logStream', 'send')).to.not.throw()
    })

    it('should accept authorize send with state and reason', function () {
      expect(() => validator.validate('authorize', { type: 'authorize', data: { state: 'unauthorized', reason: 'token expired' } }, 'logStream', 'send')).to.not.throw()
    })

    it('should accept log send', function () {
      expect(() => validator.validate('log', { type: 'log', data: { level: 3, component: 'rest' } }, 'logStream', 'send')).to.not.throw()
    })

    it('should accept error send', function () {
      expect(() => validator.validate('error', { type: 'error', data: 'something failed' }, 'logStream', 'send')).to.not.throw()
    })

    it('should accept info send', function () {
      expect(() => validator.validate('info', { type: 'info', data: { success: true } }, 'logStream', 'send')).to.not.throw()
    })

    it('should accept close send', function () {
      expect(() => validator.validate('close', { type: 'close', data: 'closing connection' }, 'logStream', 'send')).to.not.throw()
    })
  })

  describe('validate - rejects invalid payloads', function () {
    let validator

    before(function () {
      validator = asyncApiValidator.fromSource(specPath)
    })

    it('should reject authorize receive missing token', function () {
      expect(() => validator.validate('authorize', { type: 'authorize', data: {} }, 'logStream', 'receive')).to.throw()
    })

    it('should reject command receive with invalid command', function () {
      expect(() => validator.validate('command', { type: 'command', data: { command: 'invalid' } }, 'logStream', 'receive')).to.throw()
    })

    it('should reject authorize send with wrong type const', function () {
      expect(() => validator.validate('authorize', { type: 'wrong', data: { state: 'authorized' } }, 'logStream', 'send')).to.throw()
    })

    it('should reject authorize send with invalid state enum', function () {
      expect(() => validator.validate('authorize', { type: 'authorize', data: { state: 'invalid' } }, 'logStream', 'send')).to.throw()
    })

    it('should reject authorize send with extra properties in data', function () {
      expect(() => validator.validate('authorize', { type: 'authorize', data: { state: 'authorized', extra: true } }, 'logStream', 'send')).to.throw()
    })

    it('should reject error send with non-string data', function () {
      expect(() => validator.validate('error', { type: 'error', data: { message: 'not a string' } }, 'logStream', 'send')).to.throw()
    })

    it('should reject close send with non-string data', function () {
      expect(() => validator.validate('close', { type: 'close', data: 123 }, 'logStream', 'send')).to.throw()
    })

    it('should reject command receive with extra properties in data', function () {
      expect(() => validator.validate('command', { type: 'command', data: { command: 'stream-stop', extra: true } }, 'logStream', 'receive')).to.throw()
    })

    it('should reject command receive with filter level out of range', function () {
      const payload = { type: 'command', data: { command: 'stream-start', filter: { level: [0, 5] } } }
      expect(() => validator.validate('command', payload, 'logStream', 'receive')).to.throw()
    })

    it('should reject command receive with extra filter properties', function () {
      const payload = { type: 'command', data: { command: 'stream-start', filter: { level: [1], extra: true } } }
      expect(() => validator.validate('command', payload, 'logStream', 'receive')).to.throw()
    })
  })

  describe('validate - error cases', function () {
    let validator

    before(function () {
      validator = asyncApiValidator.fromSource(specPath)
    })

    it('should throw for unknown channel', function () {
      expect(() => validator.validate('authorize', {}, 'noSuchChannel', 'send')).to.throw('channel "noSuchChannel" not found')
    })

    it('should throw for unknown operation', function () {
      expect(() => validator.validate('authorize', {}, 'logStream', 'publish')).to.throw('operation "publish" not found')
    })

    it('should throw for unknown message key', function () {
      expect(() => validator.validate('noSuchMessage', {}, 'logStream', 'send')).to.throw('message "noSuchMessage"')
    })
  })
})

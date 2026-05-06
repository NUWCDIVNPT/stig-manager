import { describe, expect, it } from 'vitest'
import { OpenApiOps } from '../api/openApiOps.js'

// Minimal in-test OpenAPI definition with two ops:
//   - one path-param op (verifies path encoding stays correct)
//   - one query-param op with both scalar and array params (covers all cases)
const definition = {
  servers: [{ url: 'http://localhost/api' }],
  paths: {
    '/stigs/{benchmarkId}': {
      get: {
        operationId: 'getStig',
        parameters: [
          { name: 'benchmarkId', in: 'path', required: true, schema: { type: 'string' } },
        ],
      },
    },
    '/findings': {
      get: {
        operationId: 'getFindings',
        parameters: [
          { name: 'benchmarkId', in: 'query', schema: { type: 'string' } },
          { name: 'aggregator', in: 'query', schema: { type: 'string' } },
          { name: 'projection', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
        ],
      },
    },
  },
}

describe('OpenApiOps URL building', () => {
  const ops = new OpenApiOps({ definition })

  it('encodes spaces in query values as %20 (not +)', () => {
    const url = ops.getUrl('getFindings', {
      benchmarkId: 'VMware Aria Operations 8.x Apache',
    })
    expect(url).toBe('http://localhost/api/findings?benchmarkId=VMware%20Aria%20Operations%208.x%20Apache')
    expect(url).not.toContain('+')
  })

  it('encodes literal + in query values as %2B', () => {
    const url = ops.getUrl('getFindings', { benchmarkId: '1+1' })
    expect(url).toBe('http://localhost/api/findings?benchmarkId=1%2B1')
  })

  it('serializes array query values with repeated keys (explode form)', () => {
    const url = ops.getUrl('getFindings', { projection: ['stigs', 'metadata', 'rule'] })
    expect(url).toBe('http://localhost/api/findings?projection=stigs&projection=metadata&projection=rule')
  })

  it('encodes spaces in each element of an array query value', () => {
    const url = ops.getUrl('getFindings', {
      projection: ['with space', 'plain'],
    })
    expect(url).toBe('http://localhost/api/findings?projection=with%20space&projection=plain')
  })

  it('produces clean URLs for plain ASCII values (no over-encoding)', () => {
    const url = ops.getUrl('getFindings', { aggregator: 'groupId', benchmarkId: 'CAN_Ubuntu_18-04_STIG' })
    expect(url).toBe('http://localhost/api/findings?aggregator=groupId&benchmarkId=CAN_Ubuntu_18-04_STIG')
  })

  it('encodes path-param values with spaces as %20 (regression guard)', () => {
    const url = ops.getUrl('getStig', { benchmarkId: 'VMware Aria Operations 8.x Apache' })
    expect(url).toBe('http://localhost/api/stigs/VMware%20Aria%20Operations%208.x%20Apache')
  })

  it('omits the ? when there are no query params', () => {
    const url = ops.getUrl('getStig', { benchmarkId: 'CAN_Ubuntu' })
    expect(url).toBe('http://localhost/api/stigs/CAN_Ubuntu')
    expect(url).not.toContain('?')
  })
})

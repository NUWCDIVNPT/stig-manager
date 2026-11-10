import { expect } from 'chai'
import CollectionService from '../../../api/source/service/CollectionService.js'
import dbUtils from '../../../api/source/service/utils.js'

describe('exportToCollection error reporting', () => {
  let savedPool
  let connection

  beforeEach(() => {
    savedPool = dbUtils.pool
    connection = {
      rolledBack: false,
      released: false,
      async query(sql) {
        if (sql === 'START TRANSACTION') {
          throw new Error('database went away')
        }
        return [[]]
      },
      async rollback() { this.rolledBack = true },
      release() { this.released = true },
    }
    dbUtils.pool = { getConnection: async () => connection }
  })

  afterEach(() => {
    dbUtils.pool = savedPool
  })

  it('reports a failure as a top-level error event, as clone does', async () => {
    const events = []

    const result = await CollectionService.exportToCollection({
      srcCollectionId: 1,
      dstCollectionId: 2,
      assetStigArguments: [],
      userObject: { userId: 1 },
      progressCb: json => events.push(JSON.parse(JSON.stringify(json))),
    })

    const [event] = events.slice(-1)
    expect(result).to.equal(null)
    expect(connection.rolledBack).to.equal(true)
    expect(event).to.include({ stage: 'prepare', status: 'error', message: 'Unhandled error' })
    expect(event.stack).to.include('database went away')
  })
})

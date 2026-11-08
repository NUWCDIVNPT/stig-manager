import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { startCollectionExport } from '../api/exportResultsApi.js'
import { useExportModal } from '../composables/useExportModal.js'

vi.mock('../api/exportResultsApi.js', () => ({
  startCollectionExport: vi.fn(),
}))

vi.mock('../../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ user: ref({ collectionGrants: [] }) }),
}))

const encoder = new TextEncoder()

// The API's response: one JSON document per line, cut off wherever `body` ends.
function ndjsonResponse(body) {
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(body))
        controller.close()
      },
    }),
  }
}

const lines = (...events) => events.map(event => `${JSON.stringify(event)}\n`).join('')

const running = { stage: 'prepare', status: 'running', step: 1, stepCount: 6 }
const commit = { stage: 'commit', status: 'running' }
const result = { stage: 'result', counts: { assetsCreated: 1, stigsMapped: 1, reviewsInserted: 2, reviewsUpdated: 0 } }

function emitted(emit, name) {
  return emit.mock.calls.filter(([event]) => event === name).map(([, payload]) => payload)
}

async function runExport() {
  const emit = vi.fn()
  const modal = useExportModal(
    { visible: true, collectionId: '1', collectionName: 'Source' },
    emit,
    { prefsKeyPrefix: 'exportResults', effectiveSelections: ref([{ assetId: '1' }]) },
  )
  modal.target.value = 'collection'
  modal.selectedDestinationId.value = '2'
  modal.onSubmit()
  await vi.waitFor(() => {
    const finished = emitted(emit, 'collection-export-complete').length + emitted(emit, 'collection-export-error').length
    expect(finished).toBe(1)
  })
  return emit
}

describe('useExportModal collection export outcome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports completion after a result event', async () => {
    startCollectionExport.mockResolvedValue(ndjsonResponse(lines(running, commit, result)))

    const emit = await runExport()

    expect(emitted(emit, 'collection-export-complete')).toEqual([{ dstCollectionId: '2' }])
    expect(emitted(emit, 'collection-export-error')).toEqual([])
  })

  it('reports the server error from a top-level error event', async () => {
    const failed = { stage: 'prepare', status: 'error', message: 'Unhandled error' }
    startCollectionExport.mockResolvedValue(ndjsonResponse(lines(running, failed)))

    const emit = await runExport()

    expect(emitted(emit, 'collection-export-complete')).toEqual([])
    const [err] = emitted(emit, 'collection-export-error')
    expect(err.message).toBe('Unhandled error')
    expect(err.event).toEqual(failed)
  })

  it('does not report completion when the API wraps its error event', async () => {
    const wrapped = { progressJson: { stage: 'reviews', status: 'error', message: 'Unhandled error' } }
    startCollectionExport.mockResolvedValue(ndjsonResponse(lines(running, wrapped)))

    const emit = await runExport()

    expect(emitted(emit, 'collection-export-complete')).toEqual([])
    expect(emitted(emit, 'collection-export-error')[0].message).toMatch(/did not complete/)
  })

  it('does not report completion when the stream ends early', async () => {
    startCollectionExport.mockResolvedValue(ndjsonResponse(lines(running, commit)))

    const emit = await runExport()

    expect(emitted(emit, 'collection-export-complete')).toEqual([])
    expect(emitted(emit, 'collection-export-error')[0].message).toMatch(/did not complete/)
  })

  it('does not count a result event cut off mid-line', async () => {
    startCollectionExport.mockResolvedValue(ndjsonResponse(`${lines(running, commit)}{"stage":"resu`))

    const emit = await runExport()

    expect(emitted(emit, 'collection-export-complete')).toEqual([])
    expect(emitted(emit, 'collection-export-error')).toHaveLength(1)
  })

  it('reports a failed request', async () => {
    startCollectionExport.mockRejectedValue(new Error('HTTP 500'))

    const emit = await runExport()

    expect(emitted(emit, 'collection-export-complete')).toEqual([])
    expect(emitted(emit, 'collection-export-error')[0].message).toBe('HTTP 500')
  })
})

import { describe, expect, it } from 'vitest'
import { createNdjsonTransformStream } from './ndjsonStream.js'

async function pump(chunks) {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
      }
      controller.close()
    },
  }).pipeThrough(createNdjsonTransformStream())

  const out = []
  const reader = stream.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      return out
    }
    out.push(value)
  }
}

describe('createNdjsonTransformStream', () => {
  it('parses multiple records in a single chunk', async () => {
    expect(await pump(['{"a":1}\n{"a":2}\n'])).toEqual([{ a: 1 }, { a: 2 }])
  })

  it('emits a record split across chunks exactly once', async () => {
    expect(await pump(['{"a":', '1}\n{"a":2}\n'])).toEqual([{ a: 1 }, { a: 2 }])
  })

  it('does not double-emit when a chunk ends at a record boundary before its newline', async () => {
    expect(await pump(['{"seq":7,"valueCount":10000}', '\n{"seq":8}\n'])).toEqual([
      { seq: 7, valueCount: 10000 },
      { seq: 8 },
    ])
  })

  it('flushes a final record that has no trailing newline', async () => {
    expect(await pump(['{"a":1}\n{"a":2}'])).toEqual([{ a: 1 }, { a: 2 }])
  })

  it('drops malformed lines', async () => {
    expect(await pump(['not json\n{"a":1}\n\n'])).toEqual([{ a: 1 }])
  })
})

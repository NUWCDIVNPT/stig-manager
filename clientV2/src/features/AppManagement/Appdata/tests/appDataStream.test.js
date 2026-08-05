import { describe, expect, it } from 'vitest'
import {
  createLineSplitStream,
  detectGzipMagicBytes,
  iterateStream,
} from '../lib/appDataStream.js'

describe('detectGzipMagicBytes', () => {
  it('recognizes the GZip signature (1f 8b)', () => {
    expect(detectGzipMagicBytes(new Uint8Array([0x1F, 0x8B, 0x08, 0x00]))).toBe(true)
  })

  it('rejects non-GZip bytes', () => {
    expect(detectGzipMagicBytes(new Uint8Array([0x7B, 0x22]))).toBe(false) // '{"'
  })

  it('rejects empty or too-short input', () => {
    expect(detectGzipMagicBytes(new Uint8Array([]))).toBe(false)
    expect(detectGzipMagicBytes(new Uint8Array([0x1F]))).toBe(false)
    expect(detectGzipMagicBytes(null)).toBe(false)
  })
})

async function collect(stream) {
  const out = []
  for await (const value of iterateStream(stream)) {
    out.push(value)
  }
  return out
}

function streamFromChunks(chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
      }
      controller.close()
    },
  })
}

describe('createLineSplitStream', () => {
  it('splits a single chunk into one batch of lines without trailing separators', async () => {
    const stream = streamFromChunks(['a\nb\nc\n']).pipeThrough(createLineSplitStream())
    expect(await collect(stream)).toEqual([['a', 'b', 'c']])
  })

  it('retains a line split across chunk boundaries', async () => {
    const stream = streamFromChunks(['{"foo":', '"bar"}\n']).pipeThrough(createLineSplitStream())
    expect(await collect(stream)).toEqual([['{"foo":"bar"}']])
  })

  it('does not emit an empty batch for a chunk with no complete line', async () => {
    const stream = streamFromChunks(['{"foo":', '"bar"}\n']).pipeThrough(createLineSplitStream())
    expect((await collect(stream)).length).toBe(1)
  })

  it('flushes a final line with no trailing newline as its own batch', async () => {
    const stream = streamFromChunks(['a\nb']).pipeThrough(createLineSplitStream())
    expect(await collect(stream)).toEqual([['a'], ['b']])
  })

  it('produces nothing for an empty stream', async () => {
    const stream = streamFromChunks([]).pipeThrough(createLineSplitStream())
    expect(await collect(stream)).toEqual([])
  })
})

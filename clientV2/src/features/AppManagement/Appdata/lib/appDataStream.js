// Streaming helpers shared by AppData export analysis and import-progress
// parsing. Kept separate from appDataAnalysis.js/appDataProgress.js so those
// pure reducer modules stay trivially unit-testable without touching the
// Streams API.

// GZip files always start with this two-byte magic number. Browser-reported
// MIME type is unreliable (often empty for .gz files) and the extension is
// only a hint, so this is the authoritative signal for whether to run the
// bytes through DecompressionStream.
export function detectGzipMagicBytes(bytes) {
  return !!bytes && bytes.length >= 2 && bytes[0] === 0x1F && bytes[1] === 0x8B
}

// Reads just enough of a File/Blob to check the GZip magic bytes without
// consuming or buffering the rest of the file.
export async function detectGzipFile(file) {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  return detectGzipMagicBytes(head)
}

// Splits decoded text into lines, retaining an incomplete line across chunk
// boundaries and flushing a final line that has no trailing newline. Unlike
// shared/lib/ndjsonStream.js, this yields raw strings (not parsed/dropped
// JSON) so a caller can distinguish malformed lines from valid ones.
export function createLineSplitStream() {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        controller.enqueue(line)
      }
    },
    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue(buffer)
      }
    },
  })
}

// Iterates any ReadableStream as an async generator.
export async function* iterateStream(stream) {
  const reader = stream.getReader()
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        return
      }
      yield value
    }
  }
  finally {
    reader.releaseLock()
  }
}

// Wraps a byte stream to report read progress (0..1) as chunks pass through,
// used for the file-analysis progress bar since the browser knows the file's
// total size up front (unlike the export download, whose compressed size is
// unknown until the response completes).
export function createByteProgressStream(totalBytes, onProgress) {
  let bytesRead = 0
  return new TransformStream({
    transform(chunk, controller) {
      bytesRead += chunk.length
      onProgress(totalBytes > 0 ? Math.min(1, bytesRead / totalBytes) : 0)
      controller.enqueue(chunk)
    },
  })
}

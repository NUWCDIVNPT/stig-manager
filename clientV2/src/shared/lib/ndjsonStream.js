function safeJSONParse(value) {
  try {
    return JSON.parse(value)
  }
  catch {
    return null
  }
}

export function createNdjsonTransformStream(separator = '\n') {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer = buffer ? buffer + chunk : chunk
      const segments = buffer.split(separator)
      for (const segment of segments) {
        const parsed = safeJSONParse(segment)
        if (parsed !== null) {
          controller.enqueue(parsed)
        }
      }
      buffer = buffer.endsWith(separator) ? '' : segments[segments.length - 1]
    },
  })
}

export async function* readNdjson(response) {
  const stream = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(createNdjsonTransformStream())
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

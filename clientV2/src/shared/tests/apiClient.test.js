import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, apiCall, ApiError, apiFetch, configureApiSpec, configureAuth } from '../api/apiClient.js'

// Mock global fetch
const fetchMock = vi.fn()
globalThis.fetch = fetchMock

// Mock STIGMAN global
globalThis.STIGMAN = {
  Env: {
    apiBase: 'http://localhost/api',
  },
}

describe('apiClient', () => {
  beforeEach(() => {
    fetchMock.mockClear()
    vi.clearAllMocks()
    configureAuth({ getToken: () => null }) // Reset auth
  })

  it('should make a GET request with correct headers', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ data: 'test' }),
    })

    const result = await api.get('/test')

    expect(result).toEqual({ data: 'test' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost/api/test', expect.objectContaining({
      method: 'GET',
      headers: expect.any(Headers),
    }))

    // Verify headers
    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('should include authorization token when configured', async () => {
    configureAuth({ getToken: () => 'fake-token' })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({}),
    })

    await api.get('/protected')

    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers.get('Authorization')).toBe('Bearer fake-token')
  })

  it('should send JSON body for POST requests', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ id: 1 }),
    })

    const payload = { name: 'Item' }
    await api.post('/items', payload)

    expect(fetchMock).toHaveBeenCalledWith('http://localhost/api/items', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }))

    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('should support direct apiFetch with json option', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
    })

    const data = { direct: true }
    await apiFetch('/direct', { method: 'PUT', json: data })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost/api/direct', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(data),
    }))

    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('should throw ApiError on non-2xx responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      url: 'http://localhost/api/missing',
      text: async () => JSON.stringify({ message: 'Not Found' }),
    })

    try {
      await api.get('/missing')
      expect.fail('Should have thrown ApiError')
    }
    catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect(e.status).toBe(404)
      expect(e.body).toEqual({ message: 'Not Found' })
    }
  })

  it('should handle raw body (FormData)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{}',
    })

    const formData = new FormData()
    formData.append('file', 'content')

    await apiFetch('/upload', { method: 'POST', rawBody: formData })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost/api/upload', expect.objectContaining({
      body: formData,
    }))

    // Content-Type should NOT be set manually for FormData (browser does it)
    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers.get('Content-Type')).toBeNull()
  })

  it('should handle text response appropriately', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'some text content',
    })

    const result = await apiFetch('/text', { responseType: 'text' })
    expect(result).toBe('some text content')
  })

  describe('apiCall', () => {
    const mockDefinition = {
      openapi: '3.0.0',
      servers: [{ url: 'http://localhost/api' }],
      paths: {
        '/user': {
          get: {
            operationId: 'getUser',
            parameters: [
              { name: 'projection', in: 'query' },
            ],
          },
        },
        '/users/{userId}': {
          get: {
            operationId: 'getUserById',
            parameters: [
              { name: 'userId', in: 'path', required: true },
            ],
          },
        },
        '/search': {
          post: {
            operationId: 'searchItems',
            parameters: [
              { name: 'q', in: 'query' },
            ],
          },
        },
      },
    }

    beforeEach(() => {
      configureApiSpec(mockDefinition)
    })

    it('should invoke GET operation with path parameters', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 123, name: 'Alice' }),
      })

      const result = await apiCall('getUserById', { userId: '123' })

      expect(result).toEqual({ id: 123, name: 'Alice' })
      expect(fetchMock).toHaveBeenCalledWith('http://localhost/api/users/123', expect.objectContaining({
        method: 'GET',
      }))
    })

    it('should invoke POST operation with query params and body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ results: [] }),
      })

      const body = { filters: [] }
      await apiCall('searchItems', { q: 'term' }, body)

      expect(fetchMock).toHaveBeenCalledWith('http://localhost/api/search?q=term', expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
        body: JSON.stringify(body),
      }))
    })

    it('should throw if operationId is missing', async () => {
      await expect(apiCall('unknownOp')).rejects.toThrow('unknown operationId')
    })
  })
})

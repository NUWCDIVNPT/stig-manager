// src/features/AssetGrid/mocks/assetGrid.handlers.js
import { http, HttpResponse } from 'msw'

export const navTreeHandlers = [
  http.get('http://localhost:64001/api/collections', () =>
    HttpResponse.json([
      { collectionId: '21', name: 'Collection X' },
      { collectionId: '22', name: 'Collection Y' },
    ])),
]

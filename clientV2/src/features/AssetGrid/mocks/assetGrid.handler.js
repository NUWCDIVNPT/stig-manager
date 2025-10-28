// src/features/AssetGrid/mocks/assetGrid.handlers.js
import { http, HttpResponse } from 'msw'

export const assetGridHandlers = [
  http.get('http://localhost:64001/api/assets', ({ request }) => {
    const url = new URL(request.url)
    const cid = url.searchParams.get('collectionId')
    const projection = url.searchParams.get('projection')

    // check for expected query params
    if (cid && projection === 'stigs' && String(cid) === '21') {
      return HttpResponse.json([
        {
          assetId: '34',
          name: 'test asset stigmanadmin',
          fqdn: null,
          collection: {
            name: 'Collection Z put',
            collectionId: '1',
          },
          description: 'test desc',
          ip: '1.1.1.1',
          labelIds: [],
          mac: null,
          noncomputing: true,
          metadata: {},
          stigs: [
            {
              ruleCount: 244,
              benchmarkId: 'RHEL_7_STIG_TEST',
              revisionStr: 'V3R0.3',
              benchmarkDate: '2020-03-31',
              revisionPinned: false,
            },
            {
              ruleCount: 81,
              benchmarkId: 'VPN_SRG_TEST',
              revisionStr: 'V1R1',
              benchmarkDate: '2019-07-19',
              revisionPinned: false,
            },
            {
              ruleCount: 287,
              benchmarkId: 'Windows_10_STIG_TEST',
              revisionStr: 'V1R23',
              benchmarkDate: '2020-06-17',
              revisionPinned: false,
            },
          ],
        },
        {
          assetId: '38',
          name: 'FOMALHAUT',
          fqdn: null,
          collection: { name: 'Collection Z put', collectionId: '1' },
          description: '',
          ip: '10.0.0.27',
          labelIds: [],
          mac: null,
          noncomputing: false,
          metadata: {},
          stigs: [
            {
              ruleCount: 81,
              benchmarkId: 'VPN_SRG_TEST',
              revisionStr: 'V1R1',
              benchmarkDate: '2019-07-19',
              revisionPinned: false,
            },
          ],
        },
      ])
    }
  }),

  http.get('http://localhost:64001/api/collections/:id/labels', ({ params }) => {
    if (String(params.id) === '21') {
      return HttpResponse.json([
        { labelId: 1, name: 'Prod', color: 'ffcc00', description: 'Production assets', uses: 1 },
        { labelId: 2, name: 'PCI', color: 'cc3333', description: 'Production assets', uses: 1 },
      ])
    }
    return HttpResponse.json([])
  }),
]

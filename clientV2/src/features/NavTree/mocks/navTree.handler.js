import { http, HttpResponse } from 'msw'

export const navTreeHandlers = [
  http.get(`/api/collections`, () =>
    HttpResponse.json([
      {
        collectionId: '1',
        name: 'Collection1',
        description: null,
        settings: {
          fields: {
            detail: {
              enabled: 'always',
              required: 'always',
            },
            comment: {
              enabled: 'findings',
              required: 'findings',
            },
          },
          status: {
            canAccept: true,
            resetCriteria: 'result',
            minAcceptGrant: 3,
          },
          history: {
            maxReviews: 5,
          },
          importOptions: {
            autoStatus: {
              fail: 'submitted',
              pass: 'submitted',
              notapplicable: 'submitted',
            },
            unreviewed: 'commented',
            allowCustom: true,
            emptyDetail: 'replace',
            emptyComment: 'ignore',
            unreviewedCommented: 'informational',
          },
        },
        metadata: {
          reqRar: 'true',
          pocName: 'poc2Patched',
          pocEmail: 'pocEmail@email.com',
          pocPhone: '12342',
        },
      },
      {
        collectionId: '2',
        name: 'Collection2',
        description: null,
        settings: {
          fields: {
            detail: {
              enabled: 'always',
              required: 'always',
            },
            comment: {
              enabled: 'findings',
              required: 'findings',
            },
          },
          status: {
            canAccept: true,
            resetCriteria: 'result',
            minAcceptGrant: 3,
          },
          history: {
            maxReviews: 5,
          },
          importOptions: {
            autoStatus: {
              fail: 'submitted',
              pass: 'submitted',
              notapplicable: 'submitted',
            },
            unreviewed: 'commented',
            allowCustom: true,
            emptyDetail: 'replace',
            emptyComment: 'ignore',
            unreviewedCommented: 'informational',
          },
        },
        metadata: {
          reqRar: 'true',
          pocName: 'string',
          pocEmail: 'string',
          pocPhone: 'string',
        },
      },
      {
        collectionId: '3',
        name: 'Collection3',
        description: null,
        settings: {
          fields: {
            detail: {
              enabled: 'always',
              required: 'always',
            },
            comment: {
              enabled: 'findings',
              required: 'findings',
            },
          },
          status: {
            canAccept: true,
            resetCriteria: 'result',
            minAcceptGrant: 3,
          },
          history: {
            maxReviews: 5,
          },
          importOptions: {
            autoStatus: {
              fail: 'submitted',
              pass: 'submitted',
              notapplicable: 'submitted',
            },
            unreviewed: 'commented',
            allowCustom: true,
            emptyDetail: 'replace',
            emptyComment: 'ignore',
            unreviewedCommented: 'informational',
          },
        },
        metadata: {
          reqRar: 'true',
          pocName: 'poc2Put',
          pocEmail: 'pocEmailPut@email.com',
          pocPhone: '12342',
        },
      },

    ])),
]

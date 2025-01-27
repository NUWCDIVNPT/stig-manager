import { v4 as uuidv4 } from 'uuid'
import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { use, expect } from 'chai'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
use(deepEqualInAnyOrder)

const admin = {
  name: 'admin',
  grant: 'Owner',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44'
}

const lvl1 = {
  name: 'lvl1',
  userId: "85",
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU'
}

const lvl3 = {
  name: 'lvl3',
  userId: "44",
  grantId: '4',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDkxMjUsImlhdCI6MTY3MDU2ODMyNSwiYXV0aF90aW1lIjoxNjcwNTY4MzI1LCJqdGkiOiI4NTI5MjZmZi0xYzM4LTQwMDYtOTYwYi1kOWE0YmNhMjcxZjkiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiIzNWZhYmMwNi0wNzZlLTRmZjQtOGJkZS1mMzI1ZWE3ZGQ0ZmIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjQxNmMwYmJkLTJmNjktNGZkMC04MmE1LTdjZDBmNmRlNzUzNSIsInNlc3Npb25fc3RhdGUiOiIzMThkOGNmZi0wY2U1LTQ3MzktODEyYy1iNWI0NjdlMWQ2YzEiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6IjMxOGQ4Y2ZmLTBjZTUtNDczOS04MTJjLWI1YjQ2N2UxZDZjMSIsInByZWZlcnJlZF91c2VybmFtZSI6Imx2bDMifQ.KduimV7h4DSySAWBbWlpN1xwbfXBfNsscvx2qIx9SVAeZFSGbPZ0JtgThD9uray9xZjrk6qLNYnkoVyYQLS4M-pg8IlFp5yKJBCIeCpcTxA25MdV5VwZQcCD9pgwtEav-cgaDD2Ue6cHj_02cQGMClsfkJ2SuOUJ9nIu4B3m3Qk'
}

const lvl1TestAcl = {
  put: [
    {
      benchmarkId: reference.testCollection.benchmark,
      labelId: reference.testCollection.fullLabel,
      access: 'r'
    },
    { assetId: '154', access: 'rw' }
  ],
  putResponse: {
    defaultAccess: 'none',
    acl: [
      {
        label: {
          name: 'test-label-full',
          color: 'FF99CC',
          labelId: '755b8a28-9a68-11ec-b1bc-0242ac110002'
        },
        access: 'r',
        benchmarkId: 'VPN_SRG_TEST'
      },
      {
        asset: {
          name: 'Collection_X_lvl1_asset-2',
          assetId: '154'
        },
        access: 'rw'
      }
    ]
  },
  effectiveAcl: [
    {
      access: 'r',
      asset: {
        name: 'Collection_X_asset',
        assetId: '62'
      },
      benchmarkId: 'VPN_SRG_TEST',
      aclSources: [
        {
          aclRule: {
            label: {
              name: 'test-label-full',
              labelId: '755b8a28-9a68-11ec-b1bc-0242ac110002'
            },
            access: 'r',
            benchmarkId: 'VPN_SRG_TEST'
          },
          grantee: {
            userId: "85",
            username: 'lvl1',
            roleId: 1
          }
        }
      ]
    },
    {
      access: 'r',
      asset: {
        name: 'Collection_X_lvl1_asset-1',
        assetId: '42'
      },
      benchmarkId: 'VPN_SRG_TEST',
      aclSources: [
        {
          aclRule: {
            label: {
              name: 'test-label-full',
              labelId: '755b8a28-9a68-11ec-b1bc-0242ac110002'
            },
            access: 'r',
            benchmarkId: 'VPN_SRG_TEST'
          },
          grantee: {
            userId: "85",
            username: 'lvl1',
            roleId: 1
          }
        }
      ]
    },
    {
      access: 'rw',
      asset: {
        name: 'Collection_X_lvl1_asset-2',
        assetId: '154'
      },
      benchmarkId: 'VPN_SRG_TEST',
      aclSources: [
        {
          aclRule: {
            asset: {
              name: 'Collection_X_lvl1_asset-2',
              assetId: '154'
            },
            access: 'rw'
          },
          grantee: {
            userId: "85",
            username: 'lvl1',
            roleId: 1
          }
        }
      ]
    },
    {
      access: 'rw',
      asset: {
        name: 'Collection_X_lvl1_asset-2',
        assetId: '154'
      },
      benchmarkId: 'Windows_10_STIG_TEST',
      aclSources: [
        {
          aclRule: {
            asset: {
              name: 'Collection_X_lvl1_asset-2',
              assetId: '154'
            },
            access: 'rw'
          },
          grantee: {
            userId: "85",
            username: 'lvl1',
            roleId: 1
          }
        }
      ]
    }
  ]
}

const lvl3TestAcl = {
  put: [
    {
      benchmarkId: reference.testCollection.benchmark,
      labelId: reference.testCollection.fullLabel,
      access: 'r'
    }
  ],
  response: [
    {
      access: 'r',
      asset: {
        name: 'Collection_X_asset',
        assetId: '62'
      },
      benchmarkId: 'VPN_SRG_TEST',
      aclSources: [
        {
          aclRule: {
            label: {
              name: 'test-label-full',
              labelId: '755b8a28-9a68-11ec-b1bc-0242ac110002'
            },
            access: 'r',
            benchmarkId: 'VPN_SRG_TEST'
          },
          grantee: {
            userId: "44",
            username: 'lvl3',
            roleId: 3
          }
        }
      ]
    },
    {
      access: 'r',
      asset: {
        name: 'Collection_X_lvl1_asset-1',
        assetId: '42'
      },
      benchmarkId: 'VPN_SRG_TEST',
      aclSources: [
        {
          aclRule: {
            label: {
              name: 'test-label-full',
              labelId: '755b8a28-9a68-11ec-b1bc-0242ac110002'
            },
            access: 'r',
            benchmarkId: 'VPN_SRG_TEST'
          },
          grantee: {
            userId: "44",
            username: 'lvl3',
            roleId: 3
          }
        }
      ]
    }
  ]
}

describe(`Test Restricted user access controls`, () => {
  let lvl1DirectGrantId = null

  before(async function () {
    await utils.loadAppData()
  })
  it('should give lvl1 user restricted access to test collection', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', admin.token, [
      {
        userId: lvl1.userId,
        roleId: 1
      }
    ])
    expect(res.status).to.eql(201)
    lvl1DirectGrantId = res.body[0].grantId
  })
  it('Remove Base appdata userGroups grant from test Colleciton', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`, 'DELETE', admin.token)
    expect(res.status).to.eql(200)
  })
  it(`should set users ACL in test collection `, async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${lvl1DirectGrantId}/acl`, 'PUT', admin.token, lvl1TestAcl.put)
    expect(res.status).to.eql(200)
    expect(res.body.acl).to.deep.equalInAnyOrder(lvl1TestAcl.putResponse.acl)
  })
  it('should confirm users effective acl was set ', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl1.userId}/effective-acl`, 'GET', admin.token)
    expect(res.status).to.eql(200)
    expect(res.body).to.deep.equalInAnyOrder(lvl1TestAcl.effectiveAcl)
  })
  it('should get reviews that is associated with the ACL and confirm that is it all read only.', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`, 'GET', lvl1.token)
    expect(res.status).to.eql(200)

    for (const review of res.body) {
      if (review.assetId === '154') {
        expect(review.access).to.equal('rw')
      } else if (review.assetId === reference.testAsset.assetId) {
        expect(review.access).to.equal('r')
      }
      // sanity check
      if (
        review.assetId === reference.testAsset.assetId &&
        review.ruleId === reference.testCollection.ruleId
      ) {
        expect(
          review.access,
          'expect that the test rule exists and is read only'
        ).to.equal('r')
      }
    }
  })
  it('should reject PUT modification to reviews that is associated with the ACLs that are read only', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PUT', lvl1.token, {
      result: 'pass',
      detail: '',
      comment: 'sure',
      status: 'accepted',
      autoResult: false
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject PATCH modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', lvl1.token, {
      result: 'pass'
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject DELETE modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'DELETE', lvl1.token)
    expect(res.status).to.eql(403)
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject patch modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PATCH', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to patch the review of this rule.')
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`, 'DELETE', lvl1.token, `${JSON.stringify(reference.reviewMetadataValue)}`)
    expect(res.status).to.eql(403)
  })
})

describe(`Test manage user access control`, () => {
  before(async function () {
    await utils.loadAppData()
  })
  it(`should set users ACL in test collection `, async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${lvl3.grantId}/acl`, 'PUT', admin.token, lvl3TestAcl.put)
    expect(res.status).to.eql(200)
    expect(res.body.acl).to.have.length(1)
    expect(res.body.defaultAccess).to.equal('rw')
  })
  it('should confirm users effective acl was set ', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl3.userId}/effective-acl`, 'GET', admin.token)
    expect(res.status).to.eql(200)
    expect(res.body).to.deep.equalInAnyOrder(lvl3TestAcl.response)
  })
  it('should get reviews that is associated with the ACL and confirm that is it all read only.', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`, 'GET', lvl3.token)
    expect(res.status).to.eql(200)

    for (const review of res.body) {
      if (
        review.assetId === reference.testAsset.assetId &&
        review.ruleId === reference.testCollection.ruleId
      ) {
        expect(review.access).to.equal('r')
      }
      if (review.assetId === '62') {
        expect(review.access).to.equal('r')
      }
      if (review.assetId === '154') {
        expect(review.access).to.equal('rw')
      }
    }
  })
  it('should reject POST  modification to reviews that is associated with the ACLs that are read only', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`, 'POST', lvl3.token, [
      {
        ruleId: reference.testCollection.ruleId,
        result: 'pass',
        detail: 'test\nvisible to lvl1',
        comment: 'sure',
        autoResult: false,
        status: 'submitted'
      }
    ])
    expect(res.status).to.eql(200)
    expect(res.body.rejected).to.have.length(1)
    expect(res.body.rejected[0].reason).to.equal('no grant for this asset/ruleId')
  })
  it('should reject PUT modification to reviews that is associated with the ACLs that are read only', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PUT', lvl3.token, {
      result: 'pass',
      detail: '',
      comment: 'sure',
      status: 'accepted',
      autoResult: false
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject PATCH modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', lvl3.token, {
      result: 'pass'
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject DELETE modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'DELETE', lvl3.token)
    expect(res.status).to.eql(403)
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl3.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject patch modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PATCH', lvl3.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to patch the review of this rule.')
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl3.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`, 'DELETE', lvl3.token, `${JSON.stringify(reference.reviewMetadataValue)}`)
    expect(res.status).to.eql(403)
  })
})

describe('Test restricted user group access controls', () => {
  before(async function () {
    await utils.loadAppData()
  })
  let userGroup = null

  it('Remove Base appdata userGroup from test Colleciton', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`, 'DELETE', admin.token)
    expect(res.status).to.eql(200)
  })
  // make a group with lvl1 in it
  it('should create a userGroup', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true&projection=collections&projection=users`, 'POST', admin.token, {
      name: 'group' + uuidv4(),
      description: 'test group',
      userIds: [lvl1.userId]
    })
    userGroup = res.body
    expect(res.status).to.eql(201)
    expect(res.body.collections).to.be.empty
    for (let user of res.body.users) {
      expect(user.userId, 'expect userId to be equal to the userId returned from API').to.equal(lvl1.userId)
      expect(user.username, 'expect username to be equal to the username returned from API').to.equal(lvl1.name)
    }
  })

  // assign group to test collection with restricted
  it('should assign group created to the test collection with restricted grant', async function () {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', admin.token, [
      {
        userGroupId: userGroup.userGroupId,
        roleId: 1
      }
    ])
    expect(res.status).to.eql(201)
    expect(res.body[0].roleId).to.equal(1)
    userGroup.grantId = res.body[0].grantId
  })
  // give it read only to something use lvl1TEstAcl object
  it('should set userGroups ACL in test collection', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${userGroup.grantId}/acl`, 'PUT', admin.token, lvl1TestAcl.put)
    expect(res.status).to.eql(200)
    expect(res.body.defaultAccess).to.equal('none')
  })
  // get the effective acl and confirm that it is read only and grantee from the group
  it('should confirm users effective acl was set ', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl1.userId}/effective-acl`, 'GET', admin.token)
    expect(res.status).to.eql(200)

    for (const acl of res.body) {
      if (acl.asset.assetId === reference.testAsset.assetId) {
        expect(acl.access).to.equal('r')
        expect(acl.aclSources[0].grantee.userGroupId).to.equal(userGroup.userGroupId)
      }
    }
  })
  it('should get reviews that is associated with the ACL and confirm that is it all read only.', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`, 'GET', lvl1.token)
    expect(res.status).to.eql(200)

    for (const review of res.body) {
      if (review.assetId === '154') {
        expect(review.access).to.equal('rw')
      } else if (review.assetId === reference.testAsset.assetId) {
        expect(review.access).to.equal('r')
      }
      // sanity check
      if (
        review.assetId === reference.testAsset.assetId &&
        review.ruleId === reference.testCollection.ruleId
      ) {
        expect(
          review.access,
          'expect that the test rule exists and is read only'
        ).to.equal('r')
      }
    }
  })
  it('should reject PUT modification to reviews that is associated with the ACLs that are read only', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PUT', lvl1.token, {
      result: 'pass',
      detail: '',
      comment: 'sure',
      status: 'accepted',
      autoResult: false
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject PATCH modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', lvl1.token, {
      result: 'pass'
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject DELETE modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'DELETE', lvl1.token)
    expect(res.status).to.eql(403)
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject patch modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PATCH', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to patch the review of this rule.')
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`, 'DELETE', lvl1.token, `${JSON.stringify(reference.reviewMetadataValue)}`)
    expect(res.status).to.eql(403)
  })
})

describe('Test manage user group access control', () => {
  before(async function () {
    await utils.loadAppData()
  })

  let userGroup = null

  it('Remove Base appdata userGroup from test Colleciton', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`, 'DELETE', admin.token)
    expect(res.status).to.eql(200)
  })
  // make a group with lvl1 in it
  it('should create a userGroup', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true&projection=collections&projection=users`, 'POST', admin.token, {
      name: 'group' + uuidv4(),
      description: 'test group',
      userIds: [lvl1.userId]
    })
    userGroup = res.body
    expect(res.status).to.eql(201)
    expect(res.body.collections).to.be.empty
    for (let user of res.body.users) {
      expect(user.userId, 'expect userId to be equal to the userId returned from API').to.equal(lvl1.userId)
      expect(user.username, 'expect username to be equal to the username returned from API').to.equal(lvl1.name)
    }
  })

  // assign group to test collection with restricted
  it('should assign group created to the test collection with manage grant', async function () {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', admin.token, [
      {
        userGroupId: userGroup.userGroupId,
        roleId: 3
      }
    ])
    expect(res.status).to.eql(201)
    expect(res.body[0].roleId).to.equal(3)
    userGroup.grantId = res.body[0].grantId
  })
  // give it read only to something use lvl1TEstAcl object
  it('should set userGroups ACL in test collection', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${userGroup.grantId}/acl`, 'PUT', admin.token, lvl3TestAcl.put)
    expect(res.status).to.eql(200)
    expect(res.body.defaultAccess).to.equal('rw')
  })
  // get the effective acl and confirm that it is read only and grantee from the group
  it('should confirm users effective acl was set ', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl1.userId}/effective-acl`, 'GET', admin.token)
    expect(res.status).to.eql(200)

    for (const acl of res.body) {
      if (
        acl.asset.assetId === reference.testAsset.assetId ||
        acl.asset.assetId === '62'
      ) {
        expect(acl.access).to.equal('r')
        expect(acl.aclSources[0].grantee.userGroupId).to.equal(userGroup.userGroupId)
      }
    }
  })
  it('should get reviews that is associated with the ACL and confirm that is it all read only.', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`, 'GET', lvl1.token)
    expect(res.status).to.eql(200)

    for (const review of res.body) {
      if (review.assetId === '154') {
        expect(review.access).to.equal('rw')
      } else if (
        review.assetId === reference.testAsset.assetId &&
        review.ruleId === reference.testCollection.ruleId
      ) {
        expect(
          review.access,
          'expect that the test rule exists and is read only'
        ).to.equal('r')
      }
    }
  })
  it('should reject PUT modification to reviews that is associated with the ACLs that are read only', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PUT', lvl1.token, {
      result: 'pass',
      detail: '',
      comment: 'sure',
      status: 'accepted',
      autoResult: false
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject PATCH modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', lvl1.token, {
      result: 'pass'
    })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('no grant for this asset/ruleId')
  })
  it('should reject DELETE modification to read only review on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'DELETE', lvl1.token)
    expect(res.status).to.eql(403)
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject patch modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PATCH', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to patch the review of this rule.')
  })
  it('should reject put modification to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', lvl1.token, { [reference.reviewMetadataKey]: reference.reviewMetadataValue })
    expect(res.status).to.eql(403)
    expect(res.body.detail).to.equal('User has insufficient privilege to put the review of this rule.')
  })
  it('should reject delete modification  of metadata key to read only review metadata on test asset with test ruleId', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`, 'DELETE', lvl1.token, `${JSON.stringify(reference.reviewMetadataValue)}`)
    expect(res.status).to.eql(403)
  })
})

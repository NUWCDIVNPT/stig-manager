
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from './referenceData.js'
import {iterations} from './groupIterations.js'

const user = {
    name: 'lvl1',
    userId: '85', 
    token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU'
}

describe('GET- getEffectiveAclByCollectionUser - /collection/{collectionId}/users/{userId}/effective-acl - Test Effective ACL from Group Grant', () => {

  before(async () => {
    await utils.loadAppData()
  })

  for(const iteration of iterations){
 
    describe(`iteration:${iteration.name}`, () => {
      
      it(`should set test groups ACL: ${iteration.name}`, async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.grantId}/acl`, 'PUT', config.adminToken, iteration.put)

        expect(res.status).to.eql(200)
        expect(res.body.defaultAccess).to.equal("none")
      })

      it("should confirm group acl was set", async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.grantId}/acl`, 'GET', config.adminToken)
        expect(res.status).to.eql(200)
        expect(res.body.defaultAccess).to.equal("none")
        expect(res.body.acl.length).to.equal(iteration.put.length)
        
        for (const acl of iteration.put) {
          // Look for an exact match in res.body.acl that satisfies all specified conditions
          const exactMatch = res.body.acl.find(a => 
            (acl.assetId ? a.asset?.assetId === acl.assetId : true) &&
            (acl.labelId ? a.label?.labelId === acl.labelId : true) &&
            (acl.benchmarkId ? a.benchmarkId === acl.benchmarkId : true) &&
            (acl.access ? a.access === acl.access : true)
          )
          // Check if an exact match was found
          expect(exactMatch).to.not.be.undefined
        
          // Verify each specified field to ensure full match
          if (acl.assetId) {
            expect(exactMatch.asset.assetId).to.equal(acl.assetId)
          }
          if (acl.labelId) {
            expect(exactMatch.label.labelId).to.equal(acl.labelId)
          }
          if (acl.benchmarkId) {
            expect(exactMatch.benchmarkId).to.equal(acl.benchmarkId)
          }
          if (acl.access) {
            expect(exactMatch.access).to.equal(acl.access)
          }
        }
      })

      it('should return 200 and the effective acl for the iteration', async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${user.userId}/effective-acl`, 'GET', config.adminToken)
        expect(res.status).to.eql(200)

        const putAcl = iteration.put
        expect(res.body).to.deep.equalInAnyOrder(iteration.response)
      })
    })
  }
})

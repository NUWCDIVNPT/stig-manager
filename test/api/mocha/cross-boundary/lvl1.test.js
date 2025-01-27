import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)
import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'

const user =
{
    name: "lvl1",
    grant: "Restricted",
    userId: "85",
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU"
}
const admin = {
    // Has admin and createCollection privileges, standard appdata: Owner roleId in all collections
    name: "stigmanadmin",
    grant: "Owner",
    userId: "1",
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44"
}

describe("lvl1 cross-boundary tests", () => {
    before(async () => {
        await utils.loadAppData()
    })
    describe('GET - getUserObject - /user', () => {
        it('Return the requesters user information - check user', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/user`, 'GET', user.token)

            //expect(res.status).to.eql(200)
            expect(res.status).to.eql(200)
            expect(res.body.username).to.equal(user.name)
            for(const grant of res.body.collectionGrants) {
              expect(grant).to.exist
              expect(grant).to.have.property('collection')
              expect(grant).to.have.property('roleId')
              expect(grant.collection).to.have.property('collectionId')
              expect(grant.collection.collectionId).to.eql(reference.testCollection.collectionId)
            }
        })
    })
    describe('GET - getReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {

        it('Return the Review for an Asset and Rule - expect fail for lvl1', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleIdLvl1NoAccess}?projection=rule&projection=stigs&projection=metadata&projection=history`, 'GET', user.token)
          expect(res.status).to.eql(204)
        })
    })
    describe('GET - getStigsByCollection - /collections/{collectionId}/stigs', function () {

        it('Return the STIGs mapped in the specified Collection - lvl1 - stigStats check',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs`, 'GET', user.token)
           
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(reference.lvl1ValidStigs.length)
            for(const stig of res.body){
              expect(reference.lvl1ValidStigs).to.include(stig.benchmarkId)
              if(stig.benchmarkId === 'Windows_10_STIG_TEST'){
                expect(stig.ruleCount).to.equal(287)
                expect(stig.assetCount).to.equal(1)
              }
              else {
                expect(stig.ruleCount).to.equal(81)
                expect(stig.assetCount).to.equal(3)
                expect(stig.revisionStr).to.equal("V1R1")
              }
             
            }
        })
    })
    describe('GET - getAsset - /assets/{assetId}', () => {
        it('Return an Asset (lvl1 user requests w/ 1 of 2 stig grants, check proper AdminStats)', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs`, 'GET', user.token)
            expect(res.status).to.eql(200)
            expect(res.body.statusStats.ruleCount).to.equal(81);
            expect(res.body.statusStats.submittedCount).to.equal(5);
        })
        it('Return an Asset (lvl1 user requests w/ ZERO of 2 stig grants, expect fail)', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAssetLvl1NoAccess}?projection=statusStats&projection=stigs`, 'GET', user.token)
            expect(res.status).to.eql(403)
           
        })
    })
    describe('GET - getChecklistByCollectionStig - /collections/{collectionId}/checklists/{benchmarkId}/{revisionStr}', function () {
       
        it('Return the Checklist for the supplied Collection and STIG-revStr - lvl1 no access, empty array',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/checklists/${'Windows_10_STIG_TEST'}/${'V2R1'}`, 'GET', user.token)
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(0)
        })
    })
    describe('POST - postReviewsByAsset - /collections/{collectionId}/reviews/{assetId}', () => {

        it('Import one or more Reviews from a JSON body - ADMIN - lvl1 asset access', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`, 'POST', admin.token, [
                {
                  ruleId: reference.testRule.ruleId,
                  result: "pass",
                  detail: "ADMIN POSTED THIS",
                  comment: "sure",
                  autoResult: false,
                  status: "submitted",
                },
                {
                  ruleId: reference.ruleIdLvl1NoAccess,
                  result: "pass",
                  detail: "ADMIN POSTED THIS",
                  comment: "sure",
                  autoResult: false,
                  status: "submitted",
                },
              ])
            expect(res.status).to.eql(200)
        })
        it('Import one or more Reviews from a JSON body - ADMIN - lvl1 no asset access', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAssetLvl1NoAccess}`, 'POST', admin.token, [
            {
                ruleId: reference.testRule.ruleId,
                result: "pass",
                detail: "ADMIN POSTED THIS",
                comment: "sure",
                autoResult: false,
                status: "submitted",
            },
            {
                ruleId: reference.ruleIdLvl1NoAccess,
                result: "pass",
                detail: "ADMIN POSTED THIS",
                comment: "sure",
                autoResult: false,
                status: "submitted",
            },
            ])
        expect(res.status).to.eql(200)
        })
        it('Import one or more Reviews from a JSON body - no Asset Access', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAssetLvl1NoAccess}`, 'POST', user.token, [
                {
                "ruleId": "{{testRuleId}}",
                "result": "pass",
                "detail": "LVL1 POSTED THIS",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                }
            ])
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body.affected.updated).to.eql(0)
            expect(res.body.affected.inserted).to.eql(0)
            expect(res.body.rejected).to.have.lengthOf(1)
        })
        it('Import one or more Reviews from a JSON body - no Asset Access - multiple posts', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAssetLvl1NoAccess}`, 'POST', user.token, [
                {
                "ruleId": "{{testRuleId}}",
                "result": "pass",
                "detail": "LVL1 POSTED THIS",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                },
                {
                "ruleId": "{{testRuleId-lvl1NoAccess}}",
                "result": "pass",
                "detail": "LVL1 POSTED THIS",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                }
            ])
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body.affected.updated).to.eql(0)
            expect(res.body.affected.inserted).to.eql(0)
            expect(res.body.rejected).to.have.lengthOf(2)
        })
        it('Import one or more Reviews from a JSON body - no STIG-Asset Access', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`, 'POST', user.token, [
                {
                  ruleId: reference.ruleIdLvl1NoAccess,
                  result: "pass",
                  detail: "LVL1 POSTED THIS",
                  comment: "sure",
                  autoResult: false,
                  status: "submitted",
                },
              ])
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body.affected.updated).to.eql(0)
            expect(res.body.affected.inserted).to.eql(0)
            expect(res.body.rejected).to.have.lengthOf(1)
        })
        it('Import one or more Reviews from a JSON body - no STIG-Asset Access - multiple reviews', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`, 'POST', user.token, [
                {
                "ruleId": reference.testRule.ruleId,
                "result": "pass",
                "detail": "LVL1 POSTED THIS",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                },
                {
                "ruleId": reference.ruleIdLvl1NoAccess,
                "result": "pass",
                "detail": "LVL1 POSTED THIS",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                }
            ])
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body.affected.updated).to.eql(1)
            expect(res.body.affected.inserted).to.eql(0)
            expect(res.body.rejected).to.have.lengthOf(1)
        })
    })
    describe('PATCH - updateCollection - /collections/{collectionId}', function () {

        it('Merge provided properties with a Collection',async function () {

          const patchRequest = {
            "metadata": {
              "pocName": "poc2Patched",
              "pocEmail": "pocEmail@email.com",
              "pocPhone": "12342",
              "reqRar": "true"
            },
              "grants": [
                  {
                    "userId": "1",
                    "roleId": 1
                  },
                  {
                          "userId": "21",
                      "roleId": 2
                  },
                  {
                          "userId": "44",
                      "roleId": 3
                  },
                  {
                          "userId": "45",
                      "roleId": 4
                  }
              ]
          }           
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}?projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs`, 'PATCH', user.token, patchRequest)
            expect(res.status).to.eql(403)
        })
    })
    describe('PUT - replaceCollection - /collections/{collectionId}', function () {

        it('Set all properties of a Collection - expect fail for lvl1',async function () {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}?projection=grants&projection=owners&projection=statistics&projection=stigs&projection=assets`, 'PUT', user.token, {
                    "name": "TEST_{{$randomNoun}}-{{$randomJobType}}",
                    "description": null,
                    "settings": {
                      "fields": {
                          "detail": {
                              "enabled": "always",
                              "required": "findings"
                          },
                          "comment": {
                              "enabled": "always",
                              "required": "findings"
                          }
                      },
                      "status": {
                          "canAccept": true,
                          "minAcceptGrant": 2,
                          "resetCriteria": "result"
                      }
                    },
                    "metadata": {
                      "pocName": "poc2Patched",
                      "pocEmail": "pocEmail@email.com",
                      "pocPhone": "12342",
                      "reqRar": "true"
                    },
                      "grants": [
                          {
                            "userId": "1",
                            "roleId": 4
                          },
                          {
                                  "userId": "21",
                              "roleId": 2
                          },
                          {
                                  "userId": "44",
                              "roleId": 3
                          },
                          {
                                  "userId": "45",
                              "roleId": 4
                          }
                      ]
                  })
              expect(res.status).to.eql(403)
        })
    })
    describe('PUT - putReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
        it('Set all properties of a Review - lvl1 should work', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testRule.ruleId}?projection=rule&projection=history&projection=stigs&projection=metadata`, 'PUT', user.token, {
                    "result": "pass",
                    "detail": "test\nvisible to lvl1",
                    "comment": "sure",
                    "autoResult": false,
                    "status": "submitted"
                })
            expect(res.status).to.eql(200)
        })
        it('Set all properties of a Review - lvl1 test - no Asset Access', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAssetLvl1NoAccess}/${reference.testCollection.ruleId}?projection=rule&projection=history&projection=stigs&projection=metadata`, 'PUT', user.token, {
                    "result": "pass",
                    "detail": "test\nvisible to lvl1",
                    "comment": "sure",
                    "autoResult": false,
                    "status": "submitted"
                })
            expect(res.status).to.eql(403)
        })
        it('Set all properties of a Review - lvl1 test - no STIG-Asset Access', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleIdLvl1NoAccess}?projection=rule&projection=history&projection=stigs&projection=metadata`, 'PUT', user.token, {
                    "result": "pass",
                    "detail": "test\nvisible to lvl1",
                    "comment": "sure",
                    "autoResult": false,
                    "status": "submitted"
                })
            expect(res.status).to.eql(403)
        })
    })
    describe('PATCH - patchReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
        it('Merge provided properties with a Review - lvl1 test - noAssetAccess - w admin request check Copy 2', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAssetLvl1NoAccess}/${reference.testCollection.ruleId}`, 'PATCH', user.token, {
                "result": "pass",
                "detail": "LVL1 PATCHED THIS",
                "comment": "sure",
                "status": "submitted"
            })
            expect(res.status).to.eql(404)
        })
        it('Merge provided properties with a Review - lvl1 test - noAssetAccess - w admin request check Copy 2', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleIdLvl1NoAccess}`, 'PATCH', user.token, {
                "result": "pass",
                "detail": "LVL1 PATCHED THIS",
                "comment": "sure",
                "status": "submitted"
            })
            expect(res.status).to.eql(404)
        })
    })
    describe('DELETE - deleteReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
        it('Delete a Review - lvl1 test - noAssetAccess', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAssetLvl1NoAccess}/${reference.testAsset.testRuleId}?projection=rule&projection=history&projection=stigs`, 'DELETE', user.token)
            expect(res.status).to.eql(403)
        })
        it('Delete a Review - lvl1 test - no STIG-Asset Access', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleIdLvl1NoAccess}?projection=rule&projection=history&projection=stigs`, 'DELETE', user.token)
            expect(res.status).to.eql(403)
        })
    })
    describe('GET - getReviewMetadataValue - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys/{key}', () => {
   
      it('Should throw SmError.PriviledgeError no access to review rule', async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.scrapRuleIdWindows10}/metadata/keys/notakey`, 'GET', user.token)
        expect(res.status).to.eql(403)
        expect(res.body.error).to.be.equal("User has insufficient privilege to complete this request.")
      })
    })
    describe('PUT - putReviewMetadataValue - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys/{key}', () => {

      it('should throw SmError.PriviledgeError User has insufficient privilege to put the review of this rule. no acess to review rule', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.scrapRuleIdWindows10}/metadata/keys/${reference.reviewMetadataKey}`, 'PUT', user.token, `${JSON.stringify(reference.reviewMetadataValue)}`)
          expect(res.status).to.eql(403)
          expect(res.body.error).to.be.equal("User has insufficient privilege to complete this request.")
      })
    })
    describe('DELETE - deleteReviewMetadataKey - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys/{key}', () => {

      it('should throw SmError.PriviledgeError User has insufficient privilege to delete the review of this rule. no acess to review rule', async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.scrapRuleIdWindows10}/metadata/keys/${reference.reviewMetadataKey}`, 'DELETE', user.token, `${JSON.stringify(reference.reviewMetadataValue)}`)
        expect(res.status).to.eql(403)
        expect(res.body.error).to.be.equal("User has insufficient privilege to complete this request.")
      })
    })

})



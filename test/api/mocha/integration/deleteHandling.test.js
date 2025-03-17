
import {config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { expect } from 'chai'

const user = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe('DELETE - deleteAsset - /assets/{assetId} - DELETE - deleteCollection - /collections/{collectionId}', () => {
    describe('delete handling', () => {

        before(async function () {
            await utils.loadAppData()
        })

        let collectionToDelete = null
        let assetToDelete = null
        let deletedCollection = null
        it('Create a Collection in order to delete it', async () => {
            
            const res = await utils.executeRequest(`${config.baseUrl}/collections?elevate=true&projection=grants&projection=labels`, 'POST', user.token, {
                "name": "TEST_"+ utils.getUUIDSubString(),
                "description": "Collection TEST description",
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
                    },
                    "history": {
                        "maxReviews": 11
                    }
              },
                "metadata": {
                    "pocName": "poc2Put",
                    "pocEmail": "pocEmailPut@email.com",
                    "pocPhone": "12342",
                    "reqRar": "true"
                },
                "grants": [
                    {
                            "userId": "1",
                            "roleId": 4
                    },
                    {
                            "userId": "85",
                            "roleId": 1
                    }        
                ],
                "labels": [
                    {
                        "name": "TEST",
                        "description": "Collection label description",
                        "color": "ffffff"
                    }
                ]
            })
            expect(res.status).to.eql(201)
            collectionToDelete = res.body.collectionId
        })
        it('Create an Asset in collection to be deleted', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/assets?projection=stigs`, 'POST', user.token, {
                "name": "TEST_"+ utils.getUUIDSubString(10),
                "collectionId": collectionToDelete,
                "description": "test desc",
                "ip": "1.1.1.1",
                "labelNames": [],
                "noncomputing": true,
                "metadata": {
                    "pocName": "poc2Put",
                    "pocEmail": "pocEmailPut@email.com",
                    "pocPhone": "12342",
                    "reqRar": "true"
                },
                "stigs": [
                    "VPN_SRG_TEST",
                    "Windows_10_STIG_TEST"
                ]
            })
            expect(res.status).to.eql(201)
            assetToDelete = res.body.assetId
        })
        it('Import one or more Reviews from a JSON body Copy', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionToDelete}/reviews/${assetToDelete}`, 'POST', user.token, [
                {
                "ruleId": reference.ruleId,
                "result": "pass",
                "detail": "test\nvisible to lvl1",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                }
            ])
            expect(res.status).to.eql(200)
            const expectedResponse = {
                rejected: [],
                affected: {
                    updated: 0,
                    inserted: 1
                }
            }
            
            expect(res.body).to.eql(expectedResponse)
        })
        it(`Delete a Collection should now be deleted`, async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionToDelete}?elevate=true`, 'DELETE', user.token)
            expect(res.status).to.eql(200)
            deletedCollection = res.body.collectionId
        })
        it('put review of an asset in a deleted collection should fail', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionToDelete}/reviews/${assetToDelete}/${reference.ruleId}?projection=rule&projection=stigs`, 'PUT', user.token, {
                "result": "pass",
                "detail": "test\nvisible to lvl1",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
            })
            expect(res.status).to.eql(403)
        })
        it('Return the STIGs - from deleted collection should fail', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionToDelete}/stigs`, 'GET', user.token)
            expect(res.status).to.eql(403)
        })
        it('import reviews for asset in deleted collection should fail', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionToDelete}/reviews/${assetToDelete}`, 'POST', user.token, [
                {
                "ruleId": reference.ruleId,
                "result": "pass",
                "detail": "test\nvisible to lvl1",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                }
            ])
            expect(res.status).to.eql(403)
        })
        it('Delete an asset in a deleted collection should fail', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/assets/${assetToDelete}`, 'DELETE', user.token)
            expect(res.status).to.eql(403)
        }) 
        it('Import reviews for deleted asset should fail', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionToDelete}/reviews/${reference.testAsset.assetId}`, 'POST', user.token, [
                {
                "ruleId": reference.ruleId,
                "result": "pass",
                "detail": "test\nvisible to lvl1",
                "comment": "sure",
                "autoResult": false,
                "status": "submitted"
                }
            ])
            expect(res.status).to.eql(403)
        })
        it('Return a deleted Collection no data returned 204', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionToDelete}?elevate=true&projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs&projection=labels`, 'GET', user.token)
            expect(res.status).to.eql(204)
        })
        it('Create an Asset in deleted collection should fail', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/assets?projection=stigs`, 'POST', user.token, {
                "name": "TEST_"+ utils.getUUIDSubString(10),
                "collectionId": deletedCollection,
                "description": "test desc",
                "ip": "1.1.1.1",
                "labelNames": [reference.testCollection.fullLabelName],
                "noncomputing": true,
                "metadata": {
                    "pocName": "poc2Put",
                    "pocEmail": "pocEmailPut@email.com",
                    "pocPhone": "12342",
                    "reqRar": "true"
                },
                "stigs": [
                    "VPN_SRG_TEST",
                    "Windows_10_STIG_TEST"
                ]
            })
            expect(res.status).to.eql(403)
        })
        it('should delete the test asset', async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}`, 'DELETE', user.token)
            expect(res.status).to.eql(200)
        })
        it('get asset, it should return 403 because asset is deleted', async () => {
            
            const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}`, 'GET', user.token)
            expect(res.status).to.eql(403)
        })
    })
})


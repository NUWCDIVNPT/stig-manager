
import { XMLParser } from "fast-xml-parser"
import {config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import {iterations} from '../iterations.js'
import reference from '../referenceData.js'
import { expect } from 'chai'

const user =
  {
    "name": "stigmanadmin",
    "grant": "Owner",
    "userId": "1",
    "token":
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44"
  }

describe('PUT - putReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
 
    before(async function () {
            await utils.loadAppData()
        })

    describe('Check that "informational" results are represented as NotReviewed with Finding Details data in .ckls', () => {

        it('Set all properties of a Review with informational and a result comment', async () => {
            const putBody = {
                "result": "informational",
                "detail": "test\nvisible to lvl1, THIS REVIEW IS INFORMATIONAL (but comes back as Not_Reviewed in a ckl)",
                "comment": "sure",
                "autoResult": false,
                "status": "saved"
            }
    
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleId}?projection=rule&projection=history&projection=stigs`, 'PUT', user.token, putBody)
            expect(res.status).to.eql(200)
        })
        it('Return the Checklist for the supplied Asset and STIG XML (.ckl) - check that informational + detail exported as not_reviewed + finding_details', async () => {
            
            const url = `${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists/${reference.testCollection.benchmark}/${'V1R1'}?format=ckl`

            const options = {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${user.token}`,
                },
            }
            const res = await fetch(url, options)
            expect(res.status).to.eql(200)
            const bodyText = await res.text()

            let cklData
            const parser = new XMLParser()
            cklData = parser.parse(bodyText)
  
            let cklHostName = cklData.CHECKLIST.ASSET.HOST_NAME
            let cklIStigs = cklData.CHECKLIST.STIGS.iSTIG
            cklIStigs = [cklIStigs]
            let currentStigId

            for(const iStig of cklIStigs){
                for (let cklSiDatum of iStig.STIG_INFO.SI_DATA){
                    if (cklSiDatum.SID_NAME == 'stigid'){
                        currentStigId = cklSiDatum.SID_DATA
                        expect(currentStigId).to.be.oneOf(reference.testCollection.validStigs)
                    }
                }
                let cklVulns = iStig.VULN;
                if (currentStigId == 'VPN_SRG_TEST') {
                    expect(cklVulns).to.be.an('array').of.length(reference.checklistLength)
                    for (let thisVuln of cklVulns){
                        for (let stigData of thisVuln.STIG_DATA){
                            if (stigData.ATTRIBUTE_DATA == 'SV-106179r1_rule'){
                                expect(thisVuln.STATUS).to.eql("Not_Reviewed")
                            }
                        }
                    }
        
                }
            }
        })
        it('Set all properties of a Review - invalid result value', async () => {
            const putBody = {
                "result": "INVALID",
                "detail": "test\nvisible to lvl1, test of invalid result enum",
                "comment": "sure",
                "autoResult": false,
                "status": "saved"
            }
    
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}?projection=rule&projection=history&projection=stigs`, 'PUT', user.token, putBody)
            expect(res.status).to.eql(400)
        })
    })
})

describe('PATCH - patchReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {

    describe('review status reset check', () => {

        before(async function () {
            await utils.loadAppData()
        })

        it('PATCH Review with new details, expect status to remain', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106181r1_rule'}`, 'PATCH', user.token, {detail:"these details have changed, but the status remains"})
            expect(res.status).to.eql(200)
            expect(res.body.status).to.have.property('label').that.equals('submitted')
        })
        it('PATCH Review with new result, expect status to reset to saved', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106181r1_rule'}`, 'PATCH', user.token, {result: "pass"})
            expect(res.status).to.eql(200)
            expect(res.body.result).to.eql("pass")
            expect(res.body.status).to.have.property('label').that.equals('saved')
        })
        it('PATCH Review to submitted status, status should chnage to submitted', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106181r1_rule'}`, 'PATCH', user.token, {status: "submitted"})
            expect(res.status).to.eql(200)
            expect(res.body.status).to.have.property('label').that.equals('submitted')
        })
        it('PATCH Review patched and no longer meets Collection Requirements expect saved', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106181r1_rule'}`, 'PATCH', user.token, {result: "fail"})
            expect(res.status).to.eql(200)
            expect(res.body.result).to.eql("fail")
            expect(res.body.status).to.have.property('label').that.equals('saved')
        })
    })
})

describe('POST - postReviewsByAsset - /collections/{collectionId}/reviews/{assetId}', () => {

    for(const user of iterations){
        describe(`user:${user.name}`, () => {
            describe('test history prune', () => {

                before(async function () {
                    await utils.loadAppData()
                })

                it('Set collection history max reviews to 2', async () => {

                    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}?projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs`, 'PATCH', user.token, {
                        metadata: {
                            pocName: "poc2Patched",
                            pocEmail: "pocEmail@email.com",
                            pocPhone: "12342",
                            reqRar: "true",
                        },
                        settings: {
                            history: {
                                maxReviews: 2,
                            },
                        },
                    })

                    if(user.name  == "lvl1" || user.name  == "lvl2" || user.name  == "collectioncreator" ){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                })
                it('Post review, triggering history prune.', async () => {

                    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`, 'POST', user.token, [
                        {
                          ruleId: reference.ruleId,
                          result: "pass",
                          detail: "test\nvisible to lvl1",
                          comment: "sure",
                          autoResult: false,
                          status: "submitted",
                        },
                      ])

                    if(user.name  == "collectioncreator" ){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                })
                it('History stats - rule-asset - check history is pruned to 2', async () => {

                    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?assetId=${reference.testAsset.assetId}&ruleId=${reference.ruleId}`, 'GET', user.token)

                    if(user.name  == "lvl1" ||  user.name  == "collectioncreator" ){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                    
                    if (user.name == "lvl2" ) {
                        //lvl2 could not change collection settings, so history incremented
                        expect(res.body.collectionHistoryEntryCount).to.eql(3)
                    }
                    else {
                        //other iterations that made it this far could change collection settings, so history was pruned
                        expect(res.body.collectionHistoryEntryCount).to.eql(2)
                    }
                })
            })
        })
    }
})



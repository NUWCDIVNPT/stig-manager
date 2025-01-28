
import {config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import path from 'path'
import fs from 'fs'
import  { fileURLToPath } from 'url'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)

const user = {
  name: 'stigmanadmin',
  grant: 'Owner',
  userId: '1',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44'
}

describe('GET - getMetricsDetailByCollection - /collections/{collectionId}/metrics/detail', () => {
  describe('transfer metrics recalculation', () => {
    before(async function () {
      await utils.loadAppData()
      await utils.uploadTestStig(reference.testStigfileNonLatest)
    })
    it('Set the Assets mapped to a STIG - default rev only - scrap collection for transfer test', async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/stigs/${reference.benchmark}`, 'POST', user.token, {
            "defaultRevisionStr": "V1R0"
        })
        expect(res.status).to.eql(200)
        const expectedResponse = {
            benchmarkId: reference.benchmark,
            title: "Virtual Private Network (VPN) Security Requirements Guide",
            revisionStr: "V1R0",
            benchmarkDate: "2010-07-19",
            revisionPinned: true,
            ruleCount: 81,
            assetCount: 3,
        }    
        expect(res.body).to.deep.equal(expectedResponse)
    })
    it('Set all properties of an Asset - Change Collection to scrap collection - then check for recalculated metrics', async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}`, 'PUT', user.token, {
            "name": "Collection_X_lvl1_asset-1",
            "collectionId": reference.scrapCollection.collectionId,
            "description": "test desc",
            "ip": "1.1.1.1",
            "noncomputing": true,
            "metadata": {},
            "stigs": [
                "VPN_SRG_TEST",
                "Windows_10_STIG_TEST",
                "RHEL_7_STIG_TEST"
            ]
        })
        expect(res.status).to.eql(200)
        expect(res.body.collection.collectionId, "collectionId").to.equal(reference.scrapCollection.collectionId)
    })
    it('verify metrics were recalculated relative to new pinned rev after transfer', async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/metrics/detail`, 'GET', user.token)

        let metricsReferenceCommon = {
            assessed: 6,
            assessments: reference.checklistLength,
            maxTs: "2022-02-03T00:07:05Z",
            minTs: "2020-08-11T22:27:26Z",
            results: {
                fail: {
                    total: 3,
                    resultEngine: 0
                },
                pass: {
                    total: 1,
                    resultEngine: 0
                },
                error: {
                    total: 0,
                    resultEngine: 0
                },
                fixed: {
                    total: 0,
                    resultEngine: 0
                },
                unknown: {
                    total: 0,
                    resultEngine: 0
                },
                notchecked: {
                    total: 0,
                    resultEngine: 0
                },
                notselected: {
                    total: 0,
                    resultEngine: 0
                },
                informational: {
                    total: 0,
                    resultEngine: 0
                },
                notapplicable: {
                    total: 1,
                    resultEngine: 0
                }
            },
            findings: {
                low: 1,
                medium: 2,
                high: 0
            },    
            statuses: {
                saved: {
                    total: 1,
                    resultEngine: 0
                },
                accepted: {
                    total: 0,
                    resultEngine: 0
                },
                rejected: {
                    total: 0,
                    resultEngine: 0
                },
                submitted: {
                    total: 4,
                    resultEngine: 0
                }
            }	 
        }
    
        metricsReferenceCommon.results.unassessed = {
            total:  metricsReferenceCommon.results.informational.total + 
                    metricsReferenceCommon.results.notselected.total + 
                    metricsReferenceCommon.results.notchecked.total + 
                    metricsReferenceCommon.results.error.total + 
                    metricsReferenceCommon.results.fixed.total
        }

        for(const item of res.body){
            if (item.assetId ==  reference.testAsset.assetId && item.benchmarkId == reference.benchmark) {
                expect(item.metrics.maxTs).to.equal(metricsReferenceCommon.maxTs)
                expect(item.metrics.minTs).to.equal(metricsReferenceCommon.minTs)
                expect(item.metrics.findings.low).to.equal(metricsReferenceCommon.findings.low)
                expect(item.metrics.findings.medium).to.equal(metricsReferenceCommon.findings.medium)
                expect(item.metrics.findings.high).to.equal(metricsReferenceCommon.findings.high)
                expect(item.metrics.results.notapplicable.total).to.equal(metricsReferenceCommon.results.notapplicable.total)
                expect(item.metrics.results.pass.total).to.equal(metricsReferenceCommon.results.pass.total)
                expect(item.metrics.results.fail.total).to.equal(metricsReferenceCommon.results.fail.total)
                expect(item.metrics.results.informational.total).to.equal(metricsReferenceCommon.results.informational.total)
                expect(item.metrics.results.notchecked.total).to.equal(metricsReferenceCommon.results.notchecked.total)
                expect(item.metrics.results.notselected.total).to.equal(metricsReferenceCommon.results.notselected.total)
                expect(item.metrics.results.error.total).to.equal(metricsReferenceCommon.results.error.total)
                expect(item.metrics.results.fixed.total).to.equal(metricsReferenceCommon.results.fixed.total)
                expect(item.metrics.statuses.saved.total).to.equal(metricsReferenceCommon.statuses.saved.total)
                expect(item.metrics.statuses.submitted.total).to.equal(metricsReferenceCommon.statuses.submitted.total)
                expect(item.metrics.statuses.accepted.total).to.equal(metricsReferenceCommon.statuses.accepted.total)
                expect(item.metrics.statuses.rejected.total).to.equal(metricsReferenceCommon.statuses.rejected.total)
                expect(item.metrics.assessments).to.equal(metricsReferenceCommon.assessments)
                expect(item.metrics.assessed).to.equal(5)
            }
        }
    })
  })
})

describe('GET - getMetricsSummaryByCollectionAggStig - /collections/{collectionId}/metrics/summary/stig', function () {

    describe('default-rev-recalc', function () {
        before(async function () {
            await utils.loadAppData()
        })

        it('Import a new STIG - new Copy', async function () {
            const filename = 'U_VPN_SRG_V1R1_Manual-xccdf.xml'
            const __filename = fileURLToPath(import.meta.url)
            const __dirname = path.dirname(__filename)
            const filePath = path.join(__dirname, `../../form-data-files/${filename}`)
            const fileContent = fs.readFileSync(filePath, 'utf-8')
            
            const blob = new Blob([fileContent], { type: 'text/xml' })
        
            const formData = new FormData()
            formData.append('importFile', blob, filename)

            const res = await fetch(`${config.baseUrl}/stigs?elevate=true&clobber=true`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${user.token}`,
                },
                body: formData,
              })
            let expectedRevData = 
            {
                "benchmarkId": "VPN_SRG_TEST",
                "revisionStr": "V1R1",
                "action": "replaced"
            }
            expect(res.status).to.eql(200)
            const data = await res.json()   
            expect(data).to.deep.eql(expectedRevData)
        })
        it('Deletes the specified revision of a STIG v1r0 - with force - could fail if not present, so no tests Copy', async function () {
            await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/V1R1?elevate=true&force=true`, 'DELETE', user.token)
        })
        it('Return summary metrics - check no null benchmarks', async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/stig`, 'GET', user.token)
            expect(res.status).to.eql(200)
            for (let stig of res.body){
                expect(stig.benchmarkId).to.not.equal(null)
            }
        })
    })
})
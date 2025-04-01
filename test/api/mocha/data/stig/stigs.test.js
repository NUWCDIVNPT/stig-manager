
import path from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import {config } from '../../testConfig.js'
import { Blob } from 'buffer'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)

describe('GET - Stig', () => {

    before(async function () {
        await utils.loadAppData()
        await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
        await utils.uploadTestStig("U_VPN_SRG-OTHER_V1R1_twoRules-matchingFingerprints.xml")
    })

    for(const iteration of iterations){
        if (expectations[iteration.name] === undefined){
            it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
            continue
        }
        describe(`iteration:${iteration.name}`, () => {
            const distinct = expectations[iteration.name]
            describe('GET - getSTIGs - /stigs', () => {

                it('Return a list of available STIGs', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs`, 'GET', iteration.token)
                   
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')

                    for(let stig of res.body){
                        expect(stig).to.have.property('benchmarkId')
                        expect(stig.benchmarkId, "expect benchmarkId to be one of the stigs available").to.be.oneOf(reference.allStigsForAdmin)
                        if(stig.benchmarkId === reference.benchmark){
                            expect(stig.collectionIds).to.deep.equalInAnyOrder(distinct.testBenchmarkCollections)
                            expect(stig.lastRevisionStr, "checking for correct revision string of test benchmark").to.be.equal(reference.revisionStr)
                            expect(stig.revisionStrs, "checking for correct possible revision strings of test benchmark").to.be.eql(reference.testBenchmarkAllRevisions)
                            expect(stig.ruleCount, "checking for correct checklist length of test benchmark").to.be.equal(reference.checklistLength)
                        }
                    }
                })
                it('Return a list of available STIGs filter with title projection on vpn', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs?title=vpn`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array').of.length(3)
                    for(let stig of res.body){
                        expect(stig.benchmarkId, "expect stig benchmarkId returned to be a VPN variant").to.be.oneOf(reference.vpnStigs)
                        if(stig.benchmarkId === reference.benchmark){
                            expect(stig.collectionIds).to.deep.equalInAnyOrder(distinct.testBenchmarkCollections)
                            expect(stig.lastRevisionStr, "checking for correct revision string of test benchmark").to.be.equal(reference.revisionStr)
                            expect(stig.revisionStrs, "checking for correct possible revision strings of test benchmark").to.be.eql(reference.testBenchmarkAllRevisions)
                            expect(stig.ruleCount, "checking for correct checklist length of test benchmark").to.be.equal(reference.checklistLength)
                        }
                    }
                })
            })
            describe('GET - getCci - /stigs/ccis/{cci}', () => {

                it('Return data for the specified CCI', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/ccis/${reference.testCci.id}?projection=stigs&projection=emassAp&projection=references`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.cci, "expect to get back test cci").to.be.equal(reference.testCci.id)
                    expect(res.body.status, "expect to get back test cci status").to.be.equal(reference.testCci.status)
             
                })
            })
            describe('GET - getRuleByRuleId - /stigs/rules/{ruleId}', () => {
                it('get test ruledata with all projections besides stigs and ruleIds', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/rules/${reference.testRule.ruleId}?projection=detail&projection=ccis&projection=check&projection=fix`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.ruleId, "expect ruleId returned to be the test ruleId").to.be.equal(reference.testRule.ruleId)
                    expect(res.body.groupId, "expect fix groupId to be the test groupId").to.be.equal(reference.testRule.groupId)
                    expect(res.body.version, "expect fix version to be the test version").to.be.equal(reference.testRule.version)
                    
                })
                it("get test rule data with all projections, uses a ruleId present in two revisions", async () => {

                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/rules/${reference.VPN_SRG_TEST_sharedRule}?projection=detail&projection=ccis&projection=check&projection=fix&projection=stigs&projection=ruleIds`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.ruleId, "expect ruleId returned to be the test ruleId").to.be.equal(reference.VPN_SRG_TEST_sharedRule)
                    expect(res.body.groupId, "expect fix groupId to be the test groupId").to.be.equal("V-97043")
                    expect(res.body.version, "expect fix version to be the test version").to.be.equal("SRG-NET-000041-VPN-000110")
                    expect(res.body.stigs, "expect to get back two stig revisions").to.be.lengthOf(2)
                    for(let stig of res.body.stigs){
                        expect(stig.benchmarkId, "expect to get back test benchmark").to.be.equal(reference.benchmark)
                        expect(stig.revisionStr, "expect to get back test revision string").to.be.oneOf(["V1R1", "V1R0"])                   
                    }
                    for(let rule of res.body.ruleIds){
                        expect(rule, "expect ruleId returned to be the test ruleId").to.be.equal(reference.VPN_SRG_TEST_sharedRule)
                    }
                })
                it("get test rule data with stigs projection, expecting to get two stig revisions back which will contain a shared ruleId", async () => {

                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/rules/${reference.VPN_SRG_TEST_sharedRule}?projection=stigs`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.ruleId, "expect ruleId returned to be the test ruleId").to.be.equal(reference.VPN_SRG_TEST_sharedRule)
                    expect(res.body.groupId, "expect fix groupId to be the test groupId").to.be.equal("V-97043")
                    expect(res.body.version, "expect fix version to be the test version").to.be.equal("SRG-NET-000041-VPN-000110")
                    expect(res.body.stigs, "expect to get back two stig revisions").to.be.lengthOf(2)
                    for(let stig of res.body.stigs){
                        expect(stig.benchmarkId, "expect to get back test benchmark").to.be.equal(reference.benchmark)
                        expect(stig.revisionStr, "expect to get back test revision string").to.be.oneOf(["V1R1", "V1R0"])                   
                    }
                })
                it("get test rule data with ruleIds projection, should return ruleIds with equivalent check content hash + version. will query for both ruleIds in a single test", async () => {

                    const rule1 = "SV-106179r1_zzzzzz"
                    const rule2 = "SV-106179r1_xxxx"

                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/rules/${rule1}?projection=ruleIds`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body.ruleId, "expect ruleId returned to be the test ruleId").to.be.equal(rule1)
                    expect(res.body.groupId, "expect fix groupId to be the test groupId").to.be.equal("V-97041")
                    expect(res.body.version, "expect fix version to be the test version").to.be.equal("SRG-NET-000019-VPN-000040")
                    expect(res.body.ruleIds, "expect to get back two ruleIds with equivalent check content hash + version. ").to.be.lengthOf(2)
                    for(let rule of res.body.ruleIds){
                        expect(rule, "expect ruleId returned to be the test ruleId").to.be.oneOf([rule1, rule2])
                    }

                    const res2 = await utils.executeRequest(`${config.baseUrl}/stigs/rules/${rule2}?projection=ruleIds`, 'GET', iteration.token)
                    expect(res2.status).to.eql(200)
                    expect(res2.body.ruleId, "expect ruleId returned to be the test ruleId").to.be.equal(rule2)
                    expect(res2.body.groupId, "expect fix groupId to be the test groupId").to.be.equal(res.body.groupId)
                    expect(res2.body.version, "expect fix version to be equal to previous clone rule").to.be.equal(res.body.version)
                    expect(res2.body.ruleIds, "expect to get back two ruleIds with equivalent check content hash + version. ").to.be.lengthOf(2)
                    for(let rule of res2.body.ruleIds){
                        expect(rule, "expect ruleId returned to be the test ruleId").to.be.oneOf([rule1, rule2])
                    }

                })
            })
            describe('GET - getScapMap - /stigs/scap-maps', () => {
                it('Return a list of SCAP maps', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/scap-maps`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.deep.equalInAnyOrder([
                        {
                        scapBenchmarkId: 'CAN_Ubuntu_18-04_STIG',
                        benchmarkId: 'U_CAN_Ubuntu_18-04_STIG'
                        },
                        {
                        scapBenchmarkId: 'Mozilla_Firefox_RHEL',
                        benchmarkId: 'Mozilla_Firefox'
                        },
                        {
                        scapBenchmarkId: 'Mozilla_Firefox_Windows',
                        benchmarkId: 'Mozilla_Firefox'
                        },
                        {
                        scapBenchmarkId: 'MOZ_Firefox_Linux',
                        benchmarkId: 'MOZ_Firefox_STIG'
                        },
                        {
                        scapBenchmarkId: 'MOZ_Firefox_Windows',
                        benchmarkId: 'MOZ_Firefox_STIG'
                        },    
                        {
                        scapBenchmarkId: 'Solaris_10_X86_STIG',
                        benchmarkId: 'Solaris_10_X86'
                        }
                    ])
                })
            })
            describe('GET - getStigById - /stigs/{benchmarkId}', () => {

                it('Return properties of the test benchmark', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property('benchmarkId')
                    expect(res.body.benchmarkId, "expect returned benchmark to be the test ben").to.be.equal(reference.benchmark)
                    expect(res.body.collectionIds).to.deep.equalInAnyOrder(distinct.testBenchmarkCollections)
                    expect(res.body.lastRevisionStr, "expect returned last revision to be the test revision").to.be.equal(reference.revisionStr)
                    expect(res.body.ruleCount, "expect returned ruleCount to be the test checklist length").to.be.equal(reference.checklistLength)

                    for(const revision of res.body.revisions){
                        expect(revision.revisionStr, "expect returned revision to be one of the test revisions").to.be.oneOf(reference.testBenchmarkAllRevisions)
                        expect(revision.ruleCount, "expect returned ruleCount to be the test checklist length").to.be.equal(reference.checklistLength)
                    }

                })
            })
            describe('GET - getRevisionsByBenchmarkId - /stigs/{benchmarkId}/revisions', () => {

                it('Return a list of revisions for the test benchmark', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body).to.be.lengthOf(2)
                    for(let revision of res.body){
                        expect(revision.ruleCount).to.eql(reference.checklistLength)
                        expect(revision.benchmarkId).to.be.equal(reference.benchmark)
                        expect(revision.revisionStr).to.be.oneOf(reference.testBenchmarkAllRevisions)
                    }
                })
            })
            describe('GET - getRevisionByString - /stigs/{benchmarkId}/revisions/{revisionStr}', () => {

                it('Return metadata for the test benchmark and revision str V1R1', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${reference.revisionStr}`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property('revisionStr')
                    expect(res.body.revisionStr, "revision str to be V1R1").to.be.equal(reference.revisionStr)
                    expect(res.body.ruleCount, "Expected ruleCount to match the reference checklist length (81) for the test benchmark, but it does not").to.be.equal(reference.checklistLength)
                    expect(res.body.benchmarkId).to.be.equal(reference.benchmark)

                })
            })
            describe('GET - getCcisByRevision - /stigs/{benchmarkId}/revisions/{revisionStr}/ccis', () => {
                it('Return a list of CCIs from a STIG revision', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/ccis`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body, "expected 85 ccis").to.be.lengthOf(85)
                })
                it("Return a list of CCIs from a STIG revision latest", async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${'latest'}/ccis`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body, "expected 85 ccis").to.be.lengthOf(85)
                })
            })
            describe('GET - getGroupsByRevision - /stigs/{benchmarkId}/revisions{revisionStr}/groups', () => {
                it('Return the list of groups for the specified revision of a STIG.', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/groups?projection=rules`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body).to.be.lengthOf(reference.checklistLength)
                    for(let group of res.body){
                        if(group.groupId === reference.testRule.groupId){
                            for(const rule of group.rules){
                                expect(rule.ruleId, `expect test ruleID  ${reference.testRule.ruleId}`).to.be.equal(reference.testRule.ruleId)
                                expect(rule.version, `expect rule version to be the test version. ${reference.testRule.version}`).to.be.equal(reference.testRule.version)
                            }
                        }
                    }
                })
                it("Return the list of groups for the specified revision of a STIG latest", async () => {

                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${'latest'}/groups?projection=rules`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body).to.be.lengthOf(reference.checklistLength)
                    for(let group of res.body){
                        if(group.groupId === reference.testRule.groupId){
                            for(const rule of group.rules){
                                expect(rule.ruleId, `expect test ruleID  ${reference.testRule.ruleId}`).to.be.equal(reference.testRule.ruleId)
                                expect(rule.version, `expect rule version to be the test version. ${reference.testRule.version}`).to.be.equal(reference.testRule.version)
                            }
                        }
                    }
                })
            })
            describe('GET - getGroupByRevision - /stigs/{benchmarkId}/revisions{revisionStr}/groups/{groupId}', () => {

                it('Return the rules, checks and fixes for a Group from a specified revision of a STIG.', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/groups/${reference.testRule.groupId}?projection=rules`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property('groupId')
                    expect(res.body.groupId, `expect groupId to be ${reference.testRule.groupId}`).to.be.equal(reference.testRule.groupId)
                    for(const rule of res.body.rules){
                        expect(rule.ruleId, `expect ruleId to be ${reference.testRule.ruleId}`).to.be.equal(reference.testRule.ruleId)
                        expect(rule.version, `expect rule version to be the test version, ${reference.testRule.version}`).to.be.equal(reference.testRule.version)
                    }
                })
            }) 
            describe('GET - getRulesByRevision - /stigs/{benchmarkId}/revisions/{revisionStr}/rules', () => {
                it("Return rule data for the LATEST revision of a STIG", async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${'latest'}/rules?projection=detail&projection=ccis&projection=check&projection=fix`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body).to.be.lengthOf(reference.checklistLength)
                    for(const rule of res.body){
                        if(rule.ruleId === reference.testRule.ruleId){
                            expect(rule.groupId, `expect group id to match test group id, ${reference.testRule.groupId}`).to.be.equal(reference.testRule.groupId)
                            expect(rule.version, `expect rule version to be the test version ${reference.testRule.version}`).to.be.equal(reference.testRule.version)
                        }
                    }
                })
                it("Return rule data for the specified revision of a STIG.", async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/rules?projection=detail&projection=ccis&projection=check&projection=fix`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body).to.be.lengthOf(81)
                    for(const rule of res.body){
                        if(rule.ruleId === reference.testRule.ruleId){
                            expect(rule.groupId, `expect group id to match test group id: ${reference.testRule.groupId}`).to.be.equal(reference.testRule.groupId)
                            expect(rule.version, `expect rule version to be the test version: ${reference.testRule.version}`).to.be.equal(reference.testRule.version)
                        }
                    }
                })
            }) 
            describe('GET - getRuleByRevision - /stigs/{benchmarkId}/revisions/{revisionStr}/rules/{ruleId}', () => {
                it(`Return rule data for test benchmark ${reference.benchmark}, revision string, ${reference.revisionStr}, ${reference.testRule.ruleId}.`, async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/rules/${reference.testRule.ruleId}?projection=detail&projection=ccis&projection=check&projection=fix`, 'GET', iteration.token)
                    expect(res.status).to.eql(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.ruleId, `expect ${reference.testRule.ruleId}`).to.be.equal(reference.testRule.ruleId)
                    expect(res.body.groupId, `expect group id to match test group id: ${reference.testRule.groupId}`).to.be.equal(reference.testRule.groupId)
                    expect(res.body.version, `expect rule version to be the test version: ${reference.testRule.version}`).to.be.equal(reference.testRule.version)
                })
            })
        })
    }
})

describe('DELETE - Stig', () => {

    for(const iteration of iterations){
        if (expectations[iteration.name] === undefined){
            it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
            continue
        }
        describe(`iteration:${iteration.name}`, () => {
            const distinct = expectations[iteration.name]
            describe('DELETE - deleteStigById - /stigs/{benchmarkId}', () => {

                before(async function () {
                    // this is neeed because we will be deleting these stigs on each iteration and we need theem to be assigned to an asset 
                  await utils.uploadTestStig('U_MS_Windows_10_STIG_V1R23_Manual-xccdf.xml')
                  await utils.uploadTestStig('U_RHEL_7_STIG_V3R0-3_Manual-xccdf.xml')
                  await utils.resetScrapAsset()
                })

                it('attempts to delete stig and all revisions, fails because no force.', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.windowsBenchmark}?elevate=true`, 'DELETE', iteration.token)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(422)
                })
                it('Deletes a stig an all revisions', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.scrapBenchmark}?elevate=true&force=true`, 'DELETE', iteration.token)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)

                    const response = await utils.getStigByBenchmarkId(reference.scrapBenchmark)
                    expect(response.status).to.equal(404)

                })
                it('should throw SmError.NotFoundError No matching benchmarkId found.', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${'trashdata'}?elevate=true&force=true`, 'DELETE', iteration.token)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(404)
                })
            })
            describe('DELETE - deleteRevisionByString - /stigs/{benchmarkId}/revisions/{revisionStr}', () => {

                before(async function () {
                    // this is neeed because we will be deleting these stigs on each iteration and we need theem to be assigned to an asset 
                  await utils.uploadTestStig('U_VPN_SRG_V1R1_Manual-xccdf.xml')
                  await utils.resetScrapAsset()
                })

                it('attempts to delete latest of test benchmark, fails because latest is not a permitted revision for this endpoint!', async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/latest?elevate=true&force=true`, 'DELETE', iteration.token)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(400)
                })
                it('Deletes the specified revision of a STIG (v1r1 of test benchmark)', async () => {
                
                    const res = await utils.executeRequest(`${config.baseUrl}/stigs/${reference.benchmark}/revisions/${reference.revisionStr}?elevate=true&force=true`, 'DELETE', iteration.token)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                })
            })
        })
    }
})

describe('POST - Stig', () => {
    before(async function () {
        
       await utils.deleteStig(reference.benchmark)
    })

    for(const iteration of iterations){
        if (expectations[iteration.name] === undefined){
            it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
            continue
        }
        describe(`iteration:${iteration.name}`, () => {
            describe('POST - importBenchmark - /stigs', () => {

                it('Import a new STIG - new', async () => {
                    const filename = reference.testStigfile
                 
                   const __filename = fileURLToPath(import.meta.url)
                   const __dirname = path.dirname(__filename)
                   const filePath = path.join(__dirname, `../../../form-data-files/${filename}`)
                   
                   const fileContent = readFileSync(filePath, 'utf-8')
                   
                   // Create a Blob for the file content
                   const blob = new Blob([fileContent], { type: 'text/xml' })
                 
                   const formData = new FormData()
                   formData.append('importFile', blob, filename)
                 
                   const res = await fetch(`${config.baseUrl}/stigs?elevate=true&clobber=false`, {
                     method: 'POST',
                     headers: {
                       Authorization: `Bearer ${iteration.token}`,
                     },
                     body: formData,
                   })
                    let expectedRevData = {
                        benchmarkId: "VPN_SRG_TEST",
                        revisionStr: "V1R1",
                        action: "inserted",
                    }
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                    const data = await res.json()
                    expect(data).to.deep.eql(expectedRevData)
                })
                it('should throw SmError.PrivilegeError() no elevate', async () => {
                
                    const filename = reference.testStigfile
                    const __filename = fileURLToPath(import.meta.url)
                    const __dirname = path.dirname(__filename)
                    const filePath = path.join(__dirname, `../../../form-data-files/${filename}`)
                    
                    const fileContent = readFileSync(filePath, 'utf-8')
                    
                    const blob = new Blob([fileContent], { type: 'text/xml' })
                  
                    const formData = new FormData()
                    formData.append('importFile', blob, filename)
                  
                    const res = await fetch(`${config.baseUrl}/stigs?clobber=false`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${iteration.token}`,
                      },
                      body: formData,
                    })
                    expect(res.status).to.eql(403)
                })
                it('should throw SmError.ClientError not xml file', async () => {
                
                    const filename = 'appdata.jsonl'
                    const __filename = fileURLToPath(import.meta.url)
                    const __dirname = path.dirname(__filename)
                    const filePath = path.join(__dirname, `../../../appdata/${filename}`)
                    
                    const fileContent = readFileSync(filePath, 'utf-8')
                    
                    const blob = new Blob([fileContent], { type: 'text/xml' })
                  
                    const formData = new FormData()
                    formData.append('importFile', blob, filename)
                  
                    const res = await fetch(`${config.baseUrl}/stigs?elevate=true&clobber=false`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${iteration.token}`,
                      },
                      body: formData,
                    })
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(400)
                })
                it('Import a new STIG - preserve', async () => {
                
                    const filename = reference.testStigfile
                 
                    const __filename = fileURLToPath(import.meta.url)
                    const __dirname = path.dirname(__filename)
                    const filePath = path.join(__dirname, `../../../form-data-files/${filename}`)
                    
                    const fileContent = readFileSync(filePath, 'utf-8')
                    
                    // Create a Blob for the file content
                    const blob = new Blob([fileContent], { type: 'text/xml' })
                  
                    const formData = new FormData()
                    formData.append('importFile', blob, filename)
                  
                    const res = await fetch(`${config.baseUrl}/stigs?elevate=true&clobber=false`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${iteration.token}`,
                      },
                      body: formData,
                    })
                    let expectedRevData = 
                    {
                        "benchmarkId": "VPN_SRG_TEST",
                        "revisionStr": "V1R1",
                        "action": "preserved"
                    }
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                    const data = await res.json()
                    expect(data).to.deep.eql(expectedRevData)
                })
                it('Import a new STIG - clobber', async () => {
                    const filename = reference.testStigfile

                    const __filename = fileURLToPath(import.meta.url)
                    const __dirname = path.dirname(__filename)
                    const filePath = path.join(__dirname, `../../../form-data-files/${filename}`)
                    const fileContent = readFileSync(filePath, 'utf-8')
                    
                    const blob = new Blob([fileContent], { type: 'text/xml' })
                  
                    const formData = new FormData()
                    formData.append('importFile', blob, filename)
                  
                    const res = await fetch(`${config.baseUrl}/stigs?elevate=true&clobber=true`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${iteration.token}`,
                      },
                      body: formData,
                    })
                    let expectedRevData = 
                    {
                        "benchmarkId": "VPN_SRG_TEST",
                        "revisionStr": "V1R1",
                        "action": "replaced"
                    }
                    if(iteration.name !== "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                    const data = await res.json()
                    expect(data).to.deep.eql(expectedRevData)
                })
            })
        })
    }
})


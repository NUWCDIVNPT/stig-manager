const chai = require('chai')
const chaiHttp = require('chai-http')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const expect = chai.expect
const fs = require('fs')
const path = require('path')
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils.js')
const iterations = require("../../iterations.js")
const reference = require('../../referenceData.js')
const expectations = require('./expectations.js')

describe('GET - Stig', () => {

    before(async function () {
        this.timeout(4000)
        await utils.uploadTestStigs()
        try{
            await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
        }
        catch(err){
            console.log("no stig to upload")
        }
        await utils.loadAppData()
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
                    const res = await chai.request(config.baseUrl)
                    .get('/stigs')
                    .set('Authorization', `Bearer ${iteration.token}`)
                   
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get('/stigs?title=vpn')
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/ccis/${reference.testCci.id}?projection=stigs&projection=emassAp&projection=references`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.cci, "expect to get back test cci").to.be.equal(reference.testCci.id)
                    expect(res.body.status, "expect to get back test cci status").to.be.equal(reference.testCci.status)
             
                })
            })
            describe('GET - getRuleByRuleId - /stigs/rules/{ruleId}', () => {
                it('get test ruledata with all projections', async () => {
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/rules/${reference.testRule.ruleId}?projection=detail&projection=ccis&projection=check&projection=fix`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.ruleId, "expect ruleId returned to be the test ruleId").to.be.equal(reference.testRule.ruleId)
                    expect(res.body.groupId, "expect fix groupId to be the test groupId").to.be.equal(reference.testRule.groupId)
                    expect(res.body.version, "expect fix version to be the test version").to.be.equal(reference.testRule.version)
                    
                })
            })
            describe('GET - getScapMap - /stigs/scap-maps', () => {
                it('Return a list of SCAP maps', async () => {
                    const res = await chai.request(config.baseUrl)
                    .get('/stigs/scap-maps')
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions/${reference.revisionStr}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property('revisionStr')
                    expect(res.body.revisionStr, "revision str to be V1R1").to.be.equal(reference.revisionStr)
                    expect(res.body.ruleCount, "Expected ruleCount to match the reference checklist length (81) for the test benchmark, but it does not").to.be.equal(reference.checklistLength)
                    expect(res.body.benchmarkId).to.be.equal(reference.benchmark)

                })
            })
            describe('GET - getCcisByRevision - /stigs/{benchmarkId}/revisions/{revisionStr}/ccis', () => {
                it('Return a list of CCIs from a STIG revision', async () => {
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/ccis`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('array')
                    expect(res.body, "expected 85 ccis").to.be.lengthOf(85)
                })
            })
            describe('GET - getGroupsByRevision - /stigs/{benchmarkId}/revisions{revisionStr}/groups', () => {
                it('Return the list of groups for the specified revision of a STIG.', async () => {
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/groups?projection=rules`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/groups/${reference.testRule.groupId}?projection=rules`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions/${'latest'}/rules?projection=detail&projection=ccis&projection=check&projection=fix`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/rules?projection=detail&projection=ccis&projection=check&projection=fix`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .get(`/stigs/${reference.benchmark}/revisions/${reference.revisionStr}/rules/${reference.testRule.ruleId}?projection=detail&projection=ccis&projection=check&projection=fix`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    expect(res).to.have.status(200)
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
                    const res = await chai.request(config.baseUrl)
                    .delete(`/stigs/${reference.windowsBenchmark}?elevate=true`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(422)
                })
                it('Deletes a stig an all revisions', async () => {
                    const res = await chai.request(config.baseUrl)
                    .delete(`/stigs/${reference.scrapBenchmark}?elevate=true&force=true`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(200)

                    const response = await utils.getStigByBenchmarkId(reference.scrapBenchmark)
                    expect(response.status).to.equal(404)

                })
                it('should throw SmError.NotFoundError No matching benchmarkId found.', async () => {
                    const res = await chai.request(config.baseUrl)
                    .delete(`/stigs/${'trashdata'}?elevate=true&force=true`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(404)
                })
            })
            describe('DELETE - deleteRevisionByString - /stigs/{benchmarkId}/revisions/{revisionStr}', () => {

                before(async function () {
                    // this is neeed because we will be deleting these stigs on each iteration and we need theem to be assigned to an asset 
                  await utils.uploadTestStig('U_VPN_SRG_V1R1_Manual-xccdf.xml')
                  await utils.resetScrapAsset()
                })

                it('attempts to delete latest of test benchmark, fails because latest is not a permitted revision for this endpoint!', async () => {
                    const res = await chai.request(config.baseUrl)
                    .delete(`/stigs/${reference.benchmark}/revisions/latest?elevate=true&force=true`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res, "fails because latest cannot work in this endpoint").to.have.status(400)
                })
                it('Deletes the specified revision of a STIG (v1r1 of test benchmark)', async () => {
                
                    const res = await chai.request(config.baseUrl)
                    .delete(`/stigs/${reference.benchmark}/revisions/${reference.revisionStr}?elevate=true&force=true`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(200)
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
                
                    const directoryPath = path.join(__dirname, '../../../form-data-files/')
                    const testStigfile = reference.testStigfile
                    const filePath = path.join(directoryPath, testStigfile)
            
                    const res = await chai.request(config.baseUrl)
                    .post('/stigs?elevate=true&clobber=false')
                    .set('Authorization', `Bearer ${iteration.token}`)
                    .set('Content-Type', `multipart/form-data`)
                    .attach('importFile', fs.readFileSync(filePath), testStigfile) // Attach the file here
                    let expectedRevData = {
                        benchmarkId: "VPN_SRG_TEST",
                        revisionStr: "V1R1",
                        action: "inserted",
                    }
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(200)
                    expect(res.body).to.deep.eql(expectedRevData)
                })
                it('should throw SmError.PrivilegeError() no elevate', async () => {
                
                    const directoryPath = path.join(__dirname, '../../../form-data-files/')
                    const testStigfile = reference.testStigfile
                    const filePath = path.join(directoryPath, testStigfile)
            
                    const res = await chai.request(config.baseUrl)
                    .post('/stigs?clobber=false')
                    .set('Authorization', `Bearer ${iteration.token}`)
                    .set('Content-Type', `multipart/form-data`)
                    .attach('importFile', fs.readFileSync(filePath), testStigfile) // Attach the file here
                    expect(res).to.have.status(403)
                })
                it('should throw SmError.ClientError not xml file', async () => {
                
                    const directoryPath = path.join(__dirname, '../../../form-data-files/')
                    const testStigfile = 'appdata.jsonl'
                    const filePath = path.join(directoryPath, testStigfile)
            
                    const res = await chai.request(config.baseUrl)
                    .post('/stigs?elevate=true&clobber=false')
                    .set('Authorization', `Bearer ${iteration.token}`)
                    .set('Content-Type', `multipart/form-data`)
                    .attach('importFile', fs.readFileSync(filePath), testStigfile) // Attach the file here
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(400)
                })
                it('Import a new STIG - preserve', async () => {
                
                    const directoryPath = path.join(__dirname, '../../../form-data-files/')
                    const testStigfile = reference.testStigfile
                    const filePath = path.join(directoryPath, testStigfile)
            
                    const res = await chai.request(config.baseUrl)
                    .post('/stigs?elevate=true&clobber=false')
                    .set('Authorization', `Bearer ${iteration.token}`)
                    .set('Content-Type', `multipart/form-data`)
                    .attach('importFile', fs.readFileSync(filePath), testStigfile) // Attach the file here
                    let expectedRevData = 
                    {
                        "benchmarkId": "VPN_SRG_TEST",
                        "revisionStr": "V1R1",
                        "action": "preserved"
                    }
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(200)
                    expect(res.body).to.deep.eql(expectedRevData)
                })
                it('Import a new STIG - clobber', async () => {
                
                    const directoryPath = path.join(__dirname, '../../../form-data-files/')
                    const testStigfile = reference.testStigfile
                    const filePath = path.join(directoryPath, testStigfile)
            
                    const res = await chai.request(config.baseUrl)
                    .post('/stigs?elevate=true&clobber=true')
                    .set('Authorization', `Bearer ${iteration.token}`)
                    .set('Content-Type', `multipart/form-data`)
                    .attach('importFile', fs.readFileSync(filePath), testStigfile) // Attach the file here
                    let expectedRevData = 
                    {
                        "benchmarkId": "VPN_SRG_TEST",
                        "revisionStr": "V1R1",
                        "action": "replaced"
                    }
                    if(iteration.name !== "stigmanadmin"){
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(200)
                    expect(res.body).to.deep.eql(expectedRevData)
                })
            })
        })
    }
})


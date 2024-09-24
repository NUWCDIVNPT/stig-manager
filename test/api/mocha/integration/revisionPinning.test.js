const chai = require("chai")
const chaiHttp = require("chai-http")
chai.use(chaiHttp)
const expect = chai.expect
const config = require("../testConfig.json")
const utils = require("../utils/testUtils.js")
const reference = require("../referenceData.js")
const iterations = require("../iterations.js")
const expectations = require("./expectations.js")

describe(`POST - writeStigPropsByCollectionStig - /collections/{collectionId}/stigs/{benchmarkId} - postReviewBatch - /collections/{collectionId}/reviews`, () => {

    for(const user of iterations){
        if (expectations[user.name] === undefined){
            it(`No expectations for this iteration scenario: ${user.name}`, async () => {})
            continue
        }
        describe(`user:${user.name}`, () => {
            const distinct = expectations[user.name]
            describe('Revision Pinning', () => {

                before(async function () {
                    this.timeout(4000)
                    await utils.uploadTestStigs()
                    await utils.loadAppData()
                    await utils.createDisabledCollectionsandAssets()
                    try{
                        await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
                    }
                    catch(err){
                        console.log("no stig to upload")
                    }
                   
                })
                after(async function () {
                    this.timeout(4000)
                    try{
                        await utils.deleteStigByRevision("VPN_SRG_TEST", "V1R0")
                    }
                    catch{
                        console.log("no stig to delete")
                    }
                   
                })
                describe('Pin Revision for Collection', () => {

                    it('Return the STIGs mapped in the specified Collection', async () => {
                        const res = await chai.request(config.baseUrl)
                          .get(`/collections/${reference.testCollection.collectionId}/stigs`)
                          .set('Authorization', `Bearer ${user.token}`)
                        if (distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)
                        expect(res.body).to.be.an('array').of.length(distinct.validStigs.length)
                        for(const stig of res.body){
                            expect(distinct.validStigs).to.include(stig.benchmarkId)
                            expect(stig.revisionPinned).to.equal(false)
                        }
                    })
                    it("Set the Assets mapped to a STIG - default rev and assets", async () => {

                    const post = 
                     {
                      defaultRevisionStr: "V1R1",
                      assetIds: reference.writeStigPropsByCollectionStig,
                     }
            
                    const res = await chai
                        .request(config.baseUrl)
                        .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                        .set("Authorization", `Bearer ${user.token}`)
                        .send(post)
            
                        if(distinct.canModifyCollection === false){
                        expect(res).to.have.status(403)
                        return
                        }
            
                        expect(res).to.have.status(200)
                        expect(res.body.revisionStr).to.eql(post.defaultRevisionStr)
                        expect(res.body.revisionPinned).to.eql(true)
                        expect(res.body.ruleCount).to.eql(reference.checklistLength)
                        expect(res.body.benchmarkId).to.eql(reference.testCollection.benchmark)
                        expect(res.body.assetCount).to.eql(post.assetIds.length)
                    })
                    it("Set the Assets mapped to a STIG - default latest and assets", async () => {
            
                    const post = {
                        defaultRevisionStr: "latest",
                        assetIds: ["62", "42", "154"],
                    }
            
                    const res = await chai
                        .request(config.baseUrl)
                        .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                        .set("Authorization", `Bearer ${user.token}`)
                        .send(post)
            
                        if(distinct.canModifyCollection === false){
                        expect(res).to.have.status(403)
                        return
                        }
            
                        expect(res).to.have.status(200)
                        expect(res.body.revisionStr).to.equal(reference.testCollection.defaultRevision)
                        expect(res.body.revisionPinned).to.equal(false)
                        expect(res.body.ruleCount).to.eql(reference.checklistLength)
                        expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
                        expect(res.body.assetCount).to.eql(post.assetIds.length)
                    })
                    it("Set the Assets mapped to a STIG - assets only", async () => {
            
                    const post = {
                        assetIds: reference.writeStigPropsByCollectionStig,
                    }
            
                    const res = await chai
                        .request(config.baseUrl)
                        .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                        .set("Authorization", `Bearer ${user.token}`)
                        .send(post)
            
                        if(distinct.canModifyCollection === false){
                        expect(res).to.have.status(403)
                        return
                        }
            
                        expect(res).to.have.status(200)
                        expect(res.body.revisionStr).to.equal(reference.testCollection.defaultRevision)
                        expect(res.body.revisionPinned).to.equal(false)
                        expect(res.body.ruleCount).to.eql(reference.checklistLength)
                        expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
                        expect(res.body.assetCount).to.eql(post.assetIds.length)
                    })
                    it("Set the Assets mapped to a STIG - invalid rev - expect 422", async () => {
            
                    const post = {
                    defaultRevisionStr: "V1R5"
                    }
            
                    const res = await chai
                        .request(config.baseUrl)
                        .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                        .set("Authorization", `Bearer ${user.token}`)
                        .send(post)
            
                        if(distinct.canModifyCollection === false){
                        expect(res).to.have.status(403)
                        return
                        }
            
                        expect(res).to.have.status(422)
                    })
                    it("Set the Assets mapped to a STIG - default rev only", async () => {
            
                    const post = {
                        defaultRevisionStr: reference.testCollection.pinRevision
                    }
            
                    const res = await chai
                        .request(config.baseUrl)
                        .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                        .set("Authorization", `Bearer ${user.token}`)
                        .send(post)
            
                        if(distinct.canModifyCollection === false){
                        expect(res).to.have.status(403)
                        return
                        }
            
                        expect(res).to.have.status(200)
                        expect(res.body.revisionStr).to.equal(reference.testCollection.pinRevision)
                        expect(res.body.revisionPinned).to.equal(true)
                        expect(res.body.ruleCount).to.eql(reference.checklistLength)
                        expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
                        expect(res.body.assetCount).to.eql(reference.writeStigPropsByCollectionStig.length)
                    })
                    it("Return mapped STIGs - expect v1r0 pin", async () => {

                        const res = await chai.request(config.baseUrl)
                            .get(`/collections/${reference.testCollection.collectionId}/stigs`)
                            .set('Authorization', `Bearer ${user.token}`)
                        if (distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)

                        for(const stig of res.body){
                            expect(stig.benchmarkId).to.be.oneOf(distinct.validStigs)
                            if(stig.benchmarkId === reference.testCollection.benchmark){
                                expect(stig.revisionPinned).to.equal(distinct.pinnedState)
                                expect(stig.revisionStr).to.equal(distinct.pinnedRevStr)
                            }else{
                                expect(stig.revisionPinned).to.equal(false)
                            }
                        }
                    })
                    it("verify metrics were recalculated relative to new pinned rev", async () => {
                        
                        const res = await chai.request(config.baseUrl)
                            .get(`/collections/${reference.testCollection.collectionId}/metrics/detail`)
                            .set('Authorization', `Bearer ${user.token}`)
                        if (distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)
                        if(user.name === "lvl1" || user.name === "lvl2"){
                            //nnot sure why we are returning look into it?? 
                            return
                        }
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
                               expect(item.metrics.maxTs).to.equal(metricsReferenceCommon.maxTs);
                                expect(item.metrics.minTs).to.equal(metricsReferenceCommon.minTs);
                                expect(item.metrics.findings.low).to.equal(metricsReferenceCommon.findings.low);
                                expect(item.metrics.findings.medium).to.equal(metricsReferenceCommon.findings.medium);
                                expect(item.metrics.findings.high).to.equal(metricsReferenceCommon.findings.high);
                                expect(item.metrics.results.notapplicable.total).to.equal(metricsReferenceCommon.results.notapplicable.total);
                                expect(item.metrics.results.pass.total).to.equal(metricsReferenceCommon.results.pass.total);
                                expect(item.metrics.results.fail.total).to.equal(metricsReferenceCommon.results.fail.total);
                                expect(item.metrics.results.informational.total).to.equal(metricsReferenceCommon.results.informational.total);
                                expect(item.metrics.results.notchecked.total).to.equal(metricsReferenceCommon.results.notchecked.total);
                                expect(item.metrics.results.notselected.total).to.equal(metricsReferenceCommon.results.notselected.total);
                                expect(item.metrics.results.error.total).to.equal(metricsReferenceCommon.results.error.total);
                                expect(item.metrics.results.fixed.total).to.equal(metricsReferenceCommon.results.fixed.total);
                                expect(item.metrics.statuses.saved.total).to.equal(metricsReferenceCommon.statuses.saved.total);
                                expect(item.metrics.statuses.submitted.total).to.equal(metricsReferenceCommon.statuses.submitted.total);
                                expect(item.metrics.statuses.accepted.total).to.equal(metricsReferenceCommon.statuses.accepted.total);
                                expect(item.metrics.statuses.rejected.total).to.equal(metricsReferenceCommon.statuses.rejected.total);
                                expect(item.metrics.assessments).to.equal(metricsReferenceCommon.assessments);
                                expect(item.metrics.assessed).to.equal(5);
                            }
                        }
                    })
                    it("Set the Assets mapped to a STIG - clear assets", async () => {
            
                    const post = {
                    assetIds: []
                    }
            
                    const res = await chai
                        .request(config.baseUrl)
                        .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                        .set("Authorization", `Bearer ${user.token}`)
                        .send(post)
            
                        if(distinct.canModifyCollection === false){
                            expect(res).to.have.status(403)
                            return
                        }
            
                        expect(res).to.have.status(204)
                    })
                    it("Set the Assets mapped to a STIG - after pinned delete", async () => {
            
                    const post = {
                        assetIds: reference.writeStigPropsByCollectionStig,
                    }
            
                    const res = await chai
                        .request(config.baseUrl)
                        .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                        .set("Authorization", `Bearer ${user.token}`)
                        .send(post)
            
                        if(distinct.canModifyCollection === false){
                            expect(res).to.have.status(403)
                            return
                        }
            
                        expect(res).to.have.status(200)
                        expect(res.body.revisionStr).to.equal(reference.testCollection.defaultRevision)
                        expect(res.body.revisionPinned).to.equal(false)
                        expect(res.body.ruleCount).to.eql(reference.checklistLength)
                        expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
                        expect(res.body.assetCount).to.eql(reference.writeStigPropsByCollectionStig.length)
                    })
                    it("TEST that re-adding STIG does not have old pin", async () => {

                        const res = await chai.request(config.baseUrl)
                            .get(`/collections/${reference.testCollection.collectionId}/stigs`)
                            .set('Authorization', `Bearer ${user.token}`)
                        if (distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)

                        for(const stig of res.body){
                            expect(stig.benchmarkId).to.be.oneOf(distinct.validStigs)
                            expect(stig.revisionPinned).to.equal(false)
                        }
                    })
                    it("Set the Assets mapped to a STIG - default rev only copy", async () => {
            
                        const post = {
                        defaultRevisionStr: reference.testCollection.pinRevision
                        }
                
                        const res = await chai
                            .request(config.baseUrl)
                            .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
                            .set("Authorization", `Bearer ${user.token}`)
                            .send(post)
                
                            if(distinct.canModifyCollection === false){
                                expect(res).to.have.status(403)
                                return
                            }
                            expect(res).to.have.status(200)
                            expect(res.body.revisionStr).to.equal(reference.testCollection.pinRevision)
                            expect(res.body.revisionPinned).to.equal(true)
                            expect(res.body.ruleCount).to.eql(reference.checklistLength)
                            expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
                            expect(res.body.assetCount).to.eql(reference.writeStigPropsByCollectionStig.length)
                    })
                })
                describe('Post and Get Reviews against Colleciton with pinned rev', () => {
                    
                    it("PUT Review: rule only in latest, not default", async () => {

                        const res = await chai.request(config.baseUrl)
                            .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleId}?projection=rule&projection=stigs`)
                            .set('Authorization', `Bearer ${user.token}`)
                            .send({
                                "result": "pass",
                                "detail": "test\nvisible to lvl1",
                                "comment": "sure",
                                "autoResult": false,
                                "status": "submitted"
                            })
                        if(distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)
                        if(user.name === "lvl1" || user.name === "lvl2"){
                            return
                        }
                        const expectedReview = {
                            assetId: "42",
                            assetName: "Collection_X_lvl1_asset-1",
                            assetLabelIds: [
                              "755b8a28-9a68-11ec-b1bc-0242ac110002",
                              "5130dc84-9a68-11ec-b1bc-0242ac110002"
                              ],
                            ruleId: reference.ruleId,
                           ruleIds: [
                                  reference.ruleId
                              ],  
                            result: res.body.result,
                            resultEngine: null,
                            detail: res.body.detail,
                            autoResult: res.body.autoResult,
                            comment: res.body.comment,
                            userId: distinct.userId,
                            username: user.name,
                            ts: res.body.ts,
                            touchTs: res.body.touchTs,
                            status: {
                                ts: res.body.status.ts,
                                text: null,
                                user: {
                                    userId: distinct.userId,
                                    username: user.name
                                },
                                label: res.body.status.label
                            },
                            stigs: [
                                  {
                                      "isDefault": false,
                                      "ruleCount": 81,
                                      "benchmarkId": "VPN_SRG_TEST",
                                      "revisionStr": "V1R1",
                                      "benchmarkDate": "2019-07-19",
                                      "revisionPinned": false
                                  }
                              ],
                            rule: {
                              title: "The VPN Gateway must ensure inbound and outbound traffic is configured with a security policy in compliance with information flow control policies.",
                              ruleId: "SV-106179r1_rule",
                              version: "SRG-NET-000019-VPN-000040",
                              severity: "medium"
                            }
                          }
                          expect(res.body).to.eql(expectedReview)
                    })
                    it("PUT Review: rule is only in pinned rev - expect 201", async () => {

                        const res = await chai.request(config.baseUrl)
                            .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleIdPinnedRev}?projection=rule&projection=stigs`)
                            .set('Authorization', `Bearer ${user.token}`)
                            .send({
                                "result": "pass",
                                "detail": "test\nvisible to lvl1",
                                "comment": "sure",
                                "autoResult": false,
                                "status": "submitted"
                            })
                        if(distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(201)
                        let pinned = "V1R0"
                        let pinnedState = true
                        if(user.name === "lvl1" || user.name === "lvl2"){
                            pinnedState = false
                        }
                        const expectedReview = {
                            assetId: "42",
                            assetName: "Collection_X_lvl1_asset-1",
                            assetLabelIds: [
                              "755b8a28-9a68-11ec-b1bc-0242ac110002",
                              "5130dc84-9a68-11ec-b1bc-0242ac110002"
                              ],
                            ruleId: reference.ruleIdPinnedRev,
                           ruleIds: [
                                  reference.ruleIdPinnedRev
                              ],  
                            result: res.body.result,
                            resultEngine: null,
                            detail: res.body.detail,
                            autoResult: res.body.autoResult,
                            comment: res.body.comment,
                            userId: distinct.userId,
                            username: user.name,
                            ts: res.body.ts,
                            touchTs: res.body.touchTs,
                            status: {
                                ts: res.body.status.ts,
                                text: null,
                                user: {
                                    userId: distinct.userId,
                                    username: user.name
                                },
                                label: res.body.status.label
                            },
                            stigs: [
                                  {
                                      "isDefault": distinct.pinnedState,
                                      "ruleCount": 81,
                                      "benchmarkId": "VPN_SRG_TEST",
                                      "revisionStr": pinned,
                                      "benchmarkDate": "2010-07-19",
                                      "revisionPinned": distinct.pinnedState
                                  }
                              ],
                            rule: {
                              title: "The VPN Gateway must ensure inbound and outbound traffic is configured with a security policy in compliance with information flow control policies.",
                              ruleId: reference.ruleIdPinnedRev,
                              version: "SRG-NET-000019-VPN-000040",
                              severity: "medium"
                            }
                          }
                        expect(res.body).to.eql(expectedReview)
                    })
                    it("PUT Review: rule is only in pinned rev - 200 expected", async () => {

                        const res = await chai.request(config.baseUrl)
                            .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleIdPinnedRev}?projection=rule&projection=stigs`)
                            .set('Authorization', `Bearer ${user.token}`)
                            .send({
                                "result": "pass",
                                "detail": "test\nvisible to lvl1",
                                "comment": "sure",
                                "autoResult": false,
                                "status": "submitted"
                            })
                        if(distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)
                        let pinned = "V1R0"
                        let pinnedState = true
                        if(user.name === "lvl1" || user.name === "lvl2"){
                            pinnedState = false
                        }
                        const expectedReview = {
                            assetId: "42",
                            assetName: "Collection_X_lvl1_asset-1",
                            assetLabelIds: [
                              "755b8a28-9a68-11ec-b1bc-0242ac110002",
                              "5130dc84-9a68-11ec-b1bc-0242ac110002"
                              ],
                            ruleId: reference.ruleIdPinnedRev,
                           ruleIds: [
                                  reference.ruleIdPinnedRev
                              ],  
                            result: res.body.result,
                            resultEngine: null,
                            detail: res.body.detail,
                            autoResult: res.body.autoResult,
                            comment: res.body.comment,
                            userId: distinct.userId,
                            username: user.name,
                            ts: res.body.ts,
                            touchTs: res.body.touchTs,
                            status: {
                                ts: res.body.status.ts,
                                text: null,
                                user: {
                                    userId: distinct.userId,
                                    username: user.name
                                },
                                label: res.body.status.label
                            },
                            stigs: [
                                  {
                                      "isDefault": pinnedState,
                                      "ruleCount": 81,
                                      "benchmarkId": "VPN_SRG_TEST",
                                      "revisionStr": pinned,
                                      "benchmarkDate": "2010-07-19",
                                      "revisionPinned": pinnedState
                                  }
                              ],
                            rule: {
                              title: "The VPN Gateway must ensure inbound and outbound traffic is configured with a security policy in compliance with information flow control policies.",
                              ruleId: reference.ruleIdPinnedRev,
                              version: "SRG-NET-000019-VPN-000040",
                              severity: "medium"
                            }
                          }
                        expect(res.body).to.eql(expectedReview)
                    })
                })
                describe('batch', () => {

                    it("POST batch review: target rules defined by stig (expect pinned rules only)", async () => {

                        const res = await chai
                          .request(config.baseUrl)
                          .post(
                            `/collections/${reference.testCollection.collectionId}/reviews`
                          )
                          .set("Authorization", `Bearer ${user.token}`)
                          .send({
                            source: {
                              review: { result: "fail", detail: "tesetsetset" },
                            },
                            assets: { assetIds: ["62", "42", "154"] },
                            rules: { benchmarkIds: ["VPN_SRG_TEST"] },
                          })
                        if(distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)
                    })

                    it("Return detailed metrics for the specified Collection - check previously empty asset for 80 assesments (overlap between pin and current)", async () => {

                        const res = await chai.request(config.baseUrl)
                            .get(`/collections/${reference.testCollection.collectionId}/metrics/detail`)
                            .set('Authorization', `Bearer ${user.token}`)
                        if (distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        let testAsset = 154
                        for(item of res.body){
                            if (item.assetId ==  reference.testAsset.assetId && item.benchmarkId == reference.benchmark) {
                                expect(item.metrics.assessed).to.equal(reference.checklistLength)
                            }
                        }
                    })
                })
                describe('STIG and Revision deletes', () => {

                    it('Return the STIGs mapped in the specified Collection Copy', async () => {
                        
                        const res = await chai.request(config.baseUrl)
                            .get(`/collections/${reference.testCollection.collectionId}/stigs`)
                            .set('Authorization', `Bearer ${user.token}`)
                        if (distinct.grant === "none"){
                            expect(res).to.have.status(403)
                            return
                        }
                        expect(res).to.have.status(200)
                        let pinnedState = true;
                        let testPinnedRevStr = "V1R0"
                        if (user.name === "lvl1" || user.name === "lvl2" ) {
                            pinnedState = false
                            testPinnedRevStr = "V1R1"
                        }
                        for(const stig of res.body){
                            expect(stig.benchmarkId).to.be.oneOf(distinct.validStigs)
                            if(stig.benchmarkId === reference.testCollection.benchmark){
                                expect(stig.revisionPinned).to.equal(pinnedState)
                                expect(stig.revisionStr).to.equal(testPinnedRevStr)
                            }else{
                                expect(stig.revisionPinned).to.equal(false)
                            }
                        }
                    })
                })
            })
        })
    }
})


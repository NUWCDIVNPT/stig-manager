const chai = require("chai")
const chaiHttp = require("chai-http")
chai.use(chaiHttp)
const expect = chai.expect
const config = require("../testConfig.json")
const utils = require("../utils/testUtils")
const reference = require("../referenceData")
const iterations = require("../iterations")

describe('PATCH - patchReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId} - PUT - putReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
    
    for(const user of iterations){
        describe(`user:${user.name}`, () => {
            describe('resultEngine tests', () => {
                before(async function () {
                    this.timeout(4000)
                    await utils.uploadTestStigs()
                    await utils.loadAppData()
                })
                it('Delete a Review - freshRuleId - review may or may not exist', async () => {
                    const res = await chai.request(config.baseUrl)
                      .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.freshRuleId}`)
                      .set('Authorization', `Bearer ${user.token}`)
                    if(user.name === 'collectioncreator') {
                      expect(res).to.have.status(403)
                      return
                    }
                    expect(res).to.have.status(204)
                })
                it('Return the Review for an Asset and Rule', async () => {
                    const res = await chai.request(config.baseUrl)
                      .get(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleId}?projection=rule&projection=stigs&projection=metadata&projection=history`)
                      .set('Authorization', `Bearer ${user.token}`)

                    if(user.name === 'collectioncreator') {
                      expect(res).to.have.status(403)
                      return
                    }
                    expect(res).to.have.status(200)
                    const review = res.body
                    // checking for basic properties
                    expect(review.assetId).to.be.equal(reference.testAsset.assetId)
          
                    //check projectrions 
                    expect(review.rule.ruleId).to.be.equal(reference.ruleId)
                    expect(review.metadata).to.have.property(reference.testAsset.metadataKey)
                    expect(review.metadata[reference.testAsset.metadataKey]).to.be.equal(reference.testAsset.metadataValue)
                    for(let stig of review.stigs){
                      expect(stig.benchmarkId).to.be.oneOf(reference.testAsset.validStigs)
                    } 
                })
                it('resultEngine only - expect fail', async () => {
                    const res = await chai
                      .request(config.baseUrl)
                      .patch(
                        `/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleId}`
                      )
                      .set("Authorization", `Bearer ${user.token}`)
                      .send({
                        resultEngine: {
                          type: "script",
                          product: "Evaluate-STIG",
                          version: "1.2310.1",
                          time: "2023-12-11T12:56:14.3576272-05:00",
                          checkContent: {
                            location: "VPN_Checks:1.2023.7.24",
                          },
                          overrides: [
                            {
                              authority: "Some_AnswerFile.xml",
                              oldResult: "unknown",
                              newResult: "pass",
                              remark: "Evaluate-STIG Answer File",
                            },
                          ],
                        },
                      })
                    
                    expect(res).to.have.status(422)
                })
                it('resultEngine only - expect success', async () => {
                  const res = await chai
                    .request(config.baseUrl)
                    .patch(
                      `/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.ruleId}`
                    )
                    .set("Authorization", `Bearer ${user.token}`)
                    .send({
                      result: "pass",
                      resultEngine: {
                        type: "script",
                        product: "Evaluate-STIG",
                        version: "1.2310.1",
                        time: "2023-12-11T12:56:14.3576272-05:00",
                        checkContent: {
                          location: "VPN_Checks:1.2023.7.24",
                        },
                        overrides: [
                          {
                            authority: "Some_AnswerFile.xml",
                            oldResult: "unknown",
                            newResult: "pass",
                            remark: "Evaluate-STIG Answer File",
                          },
                        ],
                      },
                    })
                  if(user.name === 'collectioncreator') {
                    expect(res).to.have.status(403)
                    return
                  }
                  expect(res).to.have.status(200)
                  expect(res.body.result).to.eql("pass")
                  expect(res.body.touchTs).to.eql(res.body.ts)
                  expect(res.body.status).to.have.property("ts").to.not.eql(res.body.ts)
                })
                it('PUT Review: no resultEngine - check response does not include "resultEngine": 0', async () => {

                    const putBody = {
                        result: 'pass',
                        detail: 'test',
                        comment: null,
                        status: 'saved'
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.freshRuleId}`)
                        .set('Authorization', `Bearer ${user.token}`)
                        .send(putBody)
                    if(user.name === 'collectioncreator') {
                        expect(res).to.have.status(403)
                        return
                    }
                    expect(res).to.have.status(201)
                    const expectedResponse = {  
                        assetId: "42",
                        assetName: "Collection_X_lvl1_asset-1",
                        assetLabelIds: [
                        "755b8a28-9a68-11ec-b1bc-0242ac110002",
                        "5130dc84-9a68-11ec-b1bc-0242ac110002"
                        ],
                        ruleId: reference.freshRuleId,
                    ruleIds: [
                        reference.freshRuleId
                        ],  
                        result: putBody.result,
                        resultEngine: null,
                        detail: putBody.detail,
                        autoResult: false,
                        comment: "",
                        userId: user.userId,
                        username: user.name,
                        ts: res.body.ts,
                        touchTs: res.body.touchTs,
                        status: {
                            ts: res.body.status.ts,
                            text: null,
                            user: {
                                userId: user.userId,
                                username: user.name
                            },
                            label: putBody.status
                        }
                    }
                
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.eql(expectedResponse)
                })
                it('Delete a Review - freshRuleId - review may or may not exist', async () => {
                    const res = await chai.request(config.baseUrl)
                      .delete(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.freshRuleId}`)
                      .set('Authorization', `Bearer ${user.token}`)
                    if(user.name === 'collectioncreator') {
                      expect(res).to.have.status(403)
                      return
                    }
                    expect(res).to.have.status(200)
                })
                it('Import one or more Reviews from a JSON body', async () => {
                    const res = await chai.request(config.baseUrl)
                      .post(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
                      .set('Authorization', `Bearer ${user.token}`)
                      .send([
                        {
                        "ruleId": reference.ruleId,
                        "result": "pass",
                        "detail": "test\nvisible to lvl1",
                        "comment": "sure",
                        "autoResult": false,
                        "status": "submitted"
                        },
                        {
                        "ruleId": reference.freshRuleId,
                        "result": "pass",
                        "detail": "test",
                        "comment": "sure",
                        "status": "saved"
                        }
                    ])
                    const expectedResponse = {
                      rejected: [],
                      affected: {
                          inserted: 1,
                          updated: 1
                      }
                    }
                    if(user.name === 'collectioncreator') {
                      expect(res).to.have.status(403)
                      return
                    }
                    expect(res).to.have.status(200)
                    expect(res.body).to.deep.equal(expectedResponse)
                })
            })
        })
    }
})


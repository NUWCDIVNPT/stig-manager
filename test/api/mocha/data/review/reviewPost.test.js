
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)

const otherTestRuleId = "SV-106181r1_rule"

describe('POST - Review', () => {

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
      continue
    }
    describe(`iteration:${iteration.name}`, () => {
      const distinct = expectations[iteration.name]
      describe('POST - postReviewBatch - /collections/{collectionId}/reviews', () => {

        describe(`Batch Review Editing basic (no actions or update filters)`, () => {

            before(async function () {
                await utils.loadAppData("batch-test-data.jsonl")
                await utils.deleteReview(21, 62, "SV-106181r1_rule")
                await utils.deleteReview(21, 62, "SV-106181r1_rule")
                await utils.deleteReview(21, 29, "SV-106181r1_rule")
                await utils.deleteReview(21, 29, "SV-106181r1_rule")
                await utils.deleteReview(21, 62, "SV-106179r1_rule")
                await utils.deleteReview(21, 62, "SV-106179r1_rule")
                await utils.deleteReview(21, 29, "SV-106179r1_rule")
                await utils.deleteReview(21, 29, "SV-106179r1_rule")
            })
            afterEach(async function () {
              await utils.deleteReview(21, 62, "SV-106181r1_rule")
              await utils.deleteReview(21, 62, "SV-106181r1_rule")
              await utils.deleteReview(21, 29, "SV-106181r1_rule")
              await utils.deleteReview(21, 29, "SV-106181r1_rule")
              await utils.deleteReview(21, 62, "SV-106179r1_rule")
              await utils.deleteReview(21, 62, "SV-106179r1_rule")
              await utils.deleteReview(21, 29, "SV-106179r1_rule")
              await utils.deleteReview(21, 29, "SV-106179r1_rule")
            })

            it(`POST batch review: target assets, whole stig`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '29']
                },
                rules: {
                  benchmarkIds: ['VPN_SRG_TEST_Batch']
                }
              }

              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
              
              expect(res.status).to.eql(200)
            
              const reviews = await utils.getReviews(reference.testCollection.collectionId)
            
              expect(res.body.inserted).to.eql(distinct.postReviews.targetAssetsWholeStig.inserted)
              expect(res.body.updated).to.eql(distinct.postReviews.targetAssetsWholeStig.updated)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetAssetsWholeStig.failedValidation)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetAssetsWholeStig.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetAssetsWholeStig.reviewsLength)

              for(let review of reviews){
                expect(review.assetId).to.be.oneOf(["62", "29"])
                expect(review.ruleId).to.be.oneOf([reference.testCollection.ruleId, otherTestRuleId])
                expect(review.result).to.equal(postreview.source.review.result)
                expect(review.detail).to.equal(postreview.source.review.detail)
                expect(review.status.label).to.equal("saved")
                expect(review.status.user.username).to.equal(iteration.name)
                expect(review.username).to.equal(iteration.name)
              }
            })
            it(`POST batch Review: target by assets, and one rule`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '29']
                },
                rules: {
                    ruleIds: ['SV-106179r1_rule']
                  }
              }

              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
              
              expect(res.status).to.eql(200)

              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              
              expect(res.body.inserted).to.eql(distinct.postReviews.targetAssetsOneRule.inserted)
              expect(res.body.updated).to.eql(distinct.postReviews.targetAssetsOneRule.updated)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetAssetsOneRule.failedValidation)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetAssetsOneRule.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetAssetsOneRule.reviewsLength)

              for(let review of reviews){
                expect(review.assetId).to.be.oneOf(["62", "29"])
                expect(review.ruleId).to.be.equal(reference.testCollection.ruleId)
                expect(review.result).to.equal(postreview.source.review.result)
                expect(review.detail).to.equal(postreview.source.review.detail)
                expect(review.status.label).to.equal("saved")
                expect(review.status.user.username).to.equal(iteration.name)
                expect(review.username).to.equal(iteration.name)
              }
            })
            it(`POST batch Review: target by assets, and rule`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  benchmarkIds: ['VPN_SRG_TEST_Batch']
                },
                rules: {
                    ruleIds: ['SV-106179r1_rule']
                  }
                }

              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
              expect(res.status).to.eql(200)
              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              expect(res.body.inserted).to.eql(distinct.postReviews.targetAssetsAndRule.inserted)
              expect(res.body.updated).to.eql( distinct.postReviews.targetAssetsAndRule.updated)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetAssetsAndRule.failedValidation)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetAssetsAndRule.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetAssetsAndRule.reviewsLength)

              for(let review of reviews){
                expect(review.assetId).to.be.oneOf(["62", "29"])
                expect(review.ruleId).to.be.equal(reference.testCollection.ruleId)
                expect(review.result).to.equal(postreview.source.review.result)
                expect(review.detail).to.equal(postreview.source.review.detail)
                expect(review.status.label).to.equal("saved")
                expect(review.status.user.username).to.equal(iteration.name)
                expect(review.username).to.equal(iteration.name)
              }
            })
            it(`POST batch review: target stig, whole stig`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  benchmarkIds: ['VPN_SRG_TEST_Batch']
                },
                rules: {
                    benchmarkIds: ['VPN_SRG_TEST_Batch']
                  }
                }

              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
            
              expect(res.status).to.eql(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')
              const reviews = await utils.getReviews(reference.testCollection.collectionId)

              expect(res.body.inserted).to.eql(distinct.postReviews.targetStigWholeStig.inserted)
              expect(res.body.updated).to.eql(distinct.postReviews.targetStigWholeStig.updated)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetStigWholeStig.failedValidation)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetStigWholeStig.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetStigWholeStig.reviewsLength)
            
              for(let review of reviews){
                expect(review.assetId).to.be.oneOf(["62", "29"])
                expect(review.ruleId).to.be.oneOf([reference.testCollection.ruleId, otherTestRuleId])
                expect(review.result).to.equal(postreview.source.review.result)
                expect(review.detail).to.equal(postreview.source.review.detail)
                expect(review.status.label).to.equal("saved")
                expect(review.status.user.username).to.equal(iteration.name)
                expect(review.username).to.equal(iteration.name)
              }
            })
        })
        describe(`Batch Review Editing update asset 69, insert on asset 29`, () => {

          before(async function () {
            await utils.loadAppData("batch-test-data.jsonl")
          })

          it("create a review for asset 62, rule SV-106179r1_rule", async () => {
            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testbatch'
                }
              },
              assets: {
                assetIds: ['62']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)

            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(1)
            expect(res.body.updated).to.eql(0)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)  
          })

          it(`should update asset 62 and insert new review for asset 29`, async () => {

            const postreview = {
              source: {
                review: {
                  result: 'fail',
                  detail: 'tesetsetset'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                  ruleIds: ['SV-106179r1_rule']
                }
              }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('failedValidation')
            expect(res.body).to.have.property('updated')
            expect(res.body).to.have.property('inserted')

            const reviews = await utils.getReviews(reference.testCollection.collectionId)
            
            expect(res.body.inserted).to.eql(distinct.postReviews.update62Insert29.inserted)
            expect(res.body.updated).to.eql(distinct.postReviews.update62Insert29.updated)
            expect(res.body.failedValidation).to.eql(distinct.postReviews.update62Insert29.failedValidation)
            expect(res.body.validationErrors).to.have.length(distinct.postReviews.update62Insert29.validationErrors)
            expect(reviews).to.have.lengthOf(distinct.postReviews.update62Insert29.reviewsLength)

          })
        })
        describe(`Batch Review Editing - actions`, () => {

          before(async function () {
            await utils.loadAppData("batch-test-data.jsonl")
          })

          it("create a review for asset 62, rule SV-106179r1_rule", async () => {
            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testbatch'
                }
              },
              assets: {
                assetIds: ['62']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)

            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(1)
            expect(res.body.updated).to.eql(0)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)  
          })

          it(`POST batch review: target stig, whole stig - ACTION: insert. 62 already has review this should not be done`, async () => {

            const postreview = {
              source: {
                review: {
                  result: 'fail',
                  detail: 'tesetsetset'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                  ruleIds: ['SV-106179r1_rule']
                },
                action: "insert"
              }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
            expect(res.status).to.eql(200)
    
            const reviews = await utils.getReviews(reference.testCollection.collectionId)

            expect(res.body.inserted).to.eql(distinct.postReviews.targetStigWholeStigInsert.inserted)
            // key here is updated is 0
            expect(res.body.updated).to.eql(distinct.postReviews.targetStigWholeStigInsert.updated)
            expect(res.body.failedValidation).to.eql(distinct.postReviews.targetStigWholeStigInsert.failedValidation)
            expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetStigWholeStigInsert.validationErrors)
            expect(reviews).to.have.lengthOf(distinct.postReviews.targetStigWholeStigInsert.reviewsLength)
            
            for(let review of reviews){
              expect(review.assetId).to.be.oneOf(["62", "29"])
              expect(review.ruleId).to.be.equal(reference.testCollection.ruleId)
              if(review.assetId == 62){
                expect(review.result).to.equal("pass")
                expect(review.detail).to.equal("testbatch")
              }
              else {
                expect(review.result).to.equal(postreview.source.review.result)
                expect(review.detail).to.equal(postreview.source.review.detail)
              }
              expect(review.status.label).to.equal("saved")
              expect(review.status.user.username).to.equal(iteration.name)
              expect(review.username).to.equal(iteration.name)
            }
          })

          it("delete the review for asset 62, rule SV-106179r1_rule", async () => {
            const res = await utils.deleteReview(21, 62, "SV-106179r1_rule")
            expect(res).to.have.property("assetId")
          })
           
          it(`POST batch review: target stig, whole stig - ACTION: merge, should update on asset 29 and insert on asset 62`, async () => {

            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testbatch'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                  ruleIds: ['SV-106179r1_rule']
                },
                action: "merge"
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
           
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('failedValidation')
            expect(res.body).to.have.property('updated')
            expect(res.body).to.have.property('inserted')

            const reviews = await utils.getReviews(reference.testCollection.collectionId)
            
            expect(res.body.inserted).to.eql(distinct.postReviews.targetStigWholeStigMerge.inserted)
            expect(res.body.updated).to.eql(distinct.postReviews.targetStigWholeStigMerge.updated)
            expect(res.body.failedValidation).to.eql(distinct.postReviews.targetStigWholeStigMerge.failedValidation)
            expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetStigWholeStigMerge.validationErrors)
            expect(reviews).to.have.lengthOf(distinct.postReviews.targetStigWholeStigMerge.reviewsLength)

            for(let review of reviews){
              expect(review.assetId).to.be.oneOf(["62", "29"])
              expect(review.ruleId).to.be.equal(reference.testCollection.ruleId)
              expect(review.result).to.equal(postreview.source.review.result)
              expect(review.detail).to.equal(postreview.source.review.detail)
              expect(review.status.label).to.equal("saved")
              expect(review.status.user.username).to.equal(iteration.name)
              expect(review.username).to.equal(iteration.name)
            }
          })
        })
        describe(`Batch Review Editing - update action with update filters`, () => {
          
          before(async function () {
            await utils.loadAppData("batch-test-data.jsonl")
          })

          it("create a review for asset 62, rule SV-106179r1_rule (uses stigmanadmin token)", async () => {
            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testbatch'
                }
              },
              assets: {
                assetIds: ['62']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iterations[0].token, postreview)

            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(1)
            expect(res.body.updated).to.eql(0)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)  
          })
          it(`POST batch review: update but with exclusionary updateFilters`, async () => {
            const postreview = {
              source: {
                review: {
                  result: 'fail',
                  detail: 'testUpdateFilter'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              },
              updateFilters: [
                {
                  field: 'result',
                  value: 'pass'
                }
              ],
              action: 'update'
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
           
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('failedValidation')
            expect(res.body).to.have.property('updated')
            expect(res.body).to.have.property('inserted')

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)

            const reviews = await utils.getReviews(reference.testCollection.collectionId)
            expect(reviews).to.have.lengthOf(1)
            
            for(let review of reviews){
              if(review.ruleId == reference.testCollection.ruleId){
                expect(review.resultEngine).to.eql(null)
                expect(review.status.label).to.eql("saved")
                expect(review.status.user.username).to.eql("stigmanadmin")
                expect(review.username).to.eql(iteration.name)
                expect(review.result).to.eql("fail")
                expect(review.detail).to.eql("testUpdateFilter")
              }
            }
          })
          it("create a review for asset 62, rule SV-106179r1_rule (uses stigmanadmin token)", async () => {
            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testbatch'
                }
              },
              assets: {
                assetIds: ['62']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iterations[0].token, postreview)

            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)  
          })
          it(`POST batch review: update -  updateFilters update reviews where stigmanadmin (userid 1) reviews the asset. should only update 62 asset`, async () => {

            const postreview = {
              source: {
                review: {
                  result: 'fail',
                  detail: 'testUserFilter'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              },
              updateFilters: [
                {
                  field: 'userId',
                  value: '1'
                }
              ],
              action: 'update'
              }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('failedValidation')
            expect(res.body).to.have.property('updated')
            expect(res.body).to.have.property('inserted')

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)

            const reviews = await utils.getReviews(reference.testCollection.collectionId)
            
            expect(reviews).to.have.lengthOf(1)

            for(let review of reviews){
              expect(review.assetId).to.eql("62")
              expect(review.ruleId).to.eql(reference.testCollection.ruleId)
              expect(review.status.label).to.eql("saved")
              expect(review.status.user.username).to.eql("stigmanadmin")
              expect(review.username).to.eql(iteration.name)
              expect(review.result).to.eql(postreview.source.review.result)
              expect(review.detail).to.eql(postreview.source.review.detail)
            } 
            
          })
          it(`POST batch review: update - updateFilters- before date`, async () => {

            const currentTime = new Date().toISOString()

            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testDate'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              },
              updateFilters: [
                {
                field: "ts",
                condition : "lessThan",
                value: currentTime
                }
              ],
              action: 'update'
              }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
            
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('failedValidation')
            expect(res.body).to.have.property('updated')
            expect(res.body).to.have.property('inserted')

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)

            const reviews = await utils.getReviews(reference.testCollection.collectionId)
            expect(reviews).to.have.lengthOf(1)

            for(let review of reviews){
              expect(review.assetId).to.eql("62")
              expect(review.ruleId).to.eql(reference.testCollection.ruleId)
              expect(review.status.label).to.eql("saved")
              expect(review.status.user.username).to.eql("stigmanadmin")
              expect(review.username).to.eql(iteration.name)
              expect(review.result).to.eql(postreview.source.review.result)
              expect(review.detail).to.eql(postreview.source.review.detail)
              
            }
          })
          it("create a review for asset 62, rule SV-106179r1_rule with detail ends with batch (uses stigmanadmin token)", async () => {
            const postreview = {
              source: {
                review: {
                  result: 'fail',
                  detail: 'testbatch'
                }
              },
              assets: {
                assetIds: ['62']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iterations[0].token, postreview)

            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)  
          })
          it(`POST batch review: update with updateFilters - detail string ends with "batch"`, async () => {

          const postreview = {
              source: {
                review: {
                  result: 'fail',
                  detail: 'testEndsWith'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              },
              updateFilters: [
                {
                  field: 'detail',
                  condition: 'endsWith',
                  value: 'batch'
                }
              ],
              action: 'update'
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('failedValidation')
            expect(res.body).to.have.property('updated')
            expect(res.body).to.have.property('inserted')

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)

            const reviews = await utils.getReviews(reference.testCollection.collectionId)
            expect(reviews).to.have.lengthOf(1)

            for(let review of reviews){
              expect(review.assetId).to.eql("62")
              expect(review.ruleId).to.eql(reference.testCollection.ruleId)
              expect(review.status.label).to.eql("saved")
              expect(review.status.user.username).to.eql("stigmanadmin")
              expect(review.username).to.eql(iteration.name)
              expect(review.result).to.eql(postreview.source.review.result)
              expect(review.detail).to.eql(postreview.source.review.detail)
            }
          })
          it("create a review for asset 62, rule SV-106179r1_rule that submitts the review (uses stigmanadmin token)", async () => {
            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testNotSubmitted',
                  status: 'submitted'
                }
              },
              assets: {
                assetIds: ['62']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iterations[0].token, postreview)

            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)  
          })
          it(`POST batch review: update - updateFilters- only non-saved status`, async () => {

          const postreview = {
              source: {
                review: {
                //  result: 'fail',
                 // detail: 'testNotSubmitted',
                  status: 'saved'
                }
              },
              assets: {
                assetIds: ['62', '29']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              },
              updateFilters: [
                {
                  field: 'statusLabel',
                  condition: 'notequal',
                  value: 'saved'
                }
              ],
              action: 'update'
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('failedValidation')
            expect(res.body).to.have.property('updated')
            expect(res.body).to.have.property('inserted')

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)

            const reviews = await utils.getReviews(reference.testCollection.collectionId)
            expect(reviews).to.have.lengthOf(1)

            for(let review of reviews){
              expect(review.assetId).to.eql("62")
              expect(review.ruleId). to.eql(reference.testCollection.ruleId)
              expect(review.status.label).to.eql("saved")
              expect(review.status.user.username).to.eql(iteration.name)
              expect(review.username).to.eql("stigmanadmin")
              expect(review.result).to.eql("pass")
            }
          })
          it("create a review for asset 62, rule SV-106179r1_rule that saved and passes the review (uses stigmanadmin token)", async () => {
            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: 'testPassed',
                  status: 'saved'
                }
              },
              assets: {
                assetIds: ['62']
              },
              rules: {
                ruleIds: ['SV-106179r1_rule']
              }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iterations[0].token, postreview)

            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(1)
            expect(res.body.failedValidation).to.eql(0)
            expect(res.body.validationErrors).to.have.length(0)  
          })
          it(`POST batch review: update with updateFilters - pass only`, async () => {
              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'testPassOnly'
                  }
                },
                assets: {
                  assetIds: ['62', '29']
                },
                rules: {
                  ruleIds: ['SV-106179r1_rule']
                },
                updateFilters: [
                  {
                    field: 'result',
                    value: 'pass'
                  }
                ],
                action: 'update'
              }

              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
            
              expect(res.status).to.eql(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')
      
              expect(res.body.inserted).to.eql(0)
              expect(res.body.updated).to.eql(1)
              expect(res.body.failedValidation).to.eql(0)
              expect(res.body.validationErrors).to.have.length(0)
      
              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              expect(reviews).to.have.lengthOf(1)
      
              for(let review of reviews){
                expect(review.assetId).to.eql("62")
                expect(review.ruleId).to.eql(reference.testCollection.ruleId)
                expect(review.status.label).to.eql("saved")
                expect(review.status.user.username).to.eql("stigmanadmin")
                expect(review.username).to.eql(iteration.name)
                expect(review.result).to.eql("fail")
                expect(review.detail).to.eql("testPassOnly")
              }
          })
        })
        describe(`Batch Review Editing - Validation Errors, expect failure. `, () => {
              
          before(async function () {
            await utils.loadAppData("batch-test-data.jsonl")
          })

          it(`POST batch Review: target by assets, and one rule, expect validation failure - invalid result for status`, async () => {
              const postreview = {
                source: {
                  review: {
                    result: 'informational',
                    detail: 'tesetsetset',
                    status: 'submitted'
                  }
                },
                assets: {
                  assetIds: ['62', '29']
                },
                rules: { ruleIds: ['SV-106179r1_rule'] }
              }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
            expect(res.status).to.eql(200)

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(0)
            expect(res.body.failedValidation).to.eql(2)
            expect(res.body.validationErrors).to.have.length(2)
                  
            if (iteration.name == "lvl1"){
              for (const review of res.body.validationErrors){
                  expect(review.error).to.be.oneOf(["status is not allowed for the result","no grant for this asset/ruleId"])
                  if (review.assetId == 29) {
                      expect(review.error).to.eql("no grant for this asset/ruleId")                
                  }
              }
            }
            else {
              for (const review of res.body.validationErrors){
                  expect(review.error).to.eql("status is not allowed for the result")
              }   
            }    

          })
          it(`POST batch Review: target by stig, and one rule, expect validation failure - fail result, no comment`, async () => {
            const postreview = {
              source: {
                review: {
                  result: 'fail',
                  detail: 'tesetsetset',
                  comment: '',
                  status: 'submitted'
                }
              },
              assets: {
                benchmarkIds: ['VPN_SRG_TEST_Batch']
              },
              rules: { ruleIds: ['SV-106179r1_rule'] }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
        
            expect(res.status).to.eql(200)
            const reviews = await utils.getReviews(reference.testCollection.collectionId)

            expect(res.body.inserted).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.inserted)
            expect(res.body.updated).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.updated)
            expect(res.body.failedValidation).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.failedValidation)
            expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetByStigOneRuleValidationFailure.validationErrors)
            expect(reviews).to.have.lengthOf(distinct.postReviews.targetByStigOneRuleValidationFailure.reviewsLength)
      
          })
          it(`POST batch Review: target by stig, and one rule, expect validation failure - invalid result for status`, async () => {
              const postreview = {
                source: {
                  review: {
                    result: 'informational',
                    detail: 'tesetsetset',
                    status: 'submitted'
                  }
                },
                assets: {
                  benchmarkIds: ['VPN_SRG_TEST_Batch']
                },
                rules: { ruleIds: ['SV-106179r1_rule'] }
              }

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
          
          expect(res.status).to.eql(200)
          
          const reviews = await utils.getReviews(reference.testCollection.collectionId)
      
          expect(res.body.inserted).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.inserted)
          expect(res.body.updated).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.updated)
          expect(res.body.failedValidation).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.failedValidation)
          expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetByStigOneRuleValidationFailure.validationErrors)
          expect(reviews).to.have.lengthOf(distinct.postReviews.targetByStigOneRuleValidationFailure.reviewsLength)

          })
          it(`POST batch Review: target by stig, and one rule, expect validation failure - no detail`, async () => {
            const postreview = {
              source: {
                review: {
                  result: 'pass',
                  detail: '',
                  comment: 'test comment',
                  status: 'submitted'
                }
              },
              assets: {
                benchmarkIds: ['VPN_SRG_TEST_Batch']
              },
              rules: { ruleIds: ['SV-106179r1_rule'] }
            }

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, postreview)
            
            expect(res.status).to.eql(200)
            const reviews = await utils.getReviews(reference.testCollection.collectionId)
        
            expect(res.body.inserted).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.inserted)
            expect(res.body.updated).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.updated)
            expect(res.body.failedValidation).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.failedValidation)
            expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetByStigOneRuleValidationFailure.validationErrors)
            expect(reviews).to.have.lengthOf(distinct.postReviews.targetByStigOneRuleValidationFailure.reviewsLength)
          })
        })
        describe('Batch Review Editing - In code errors', () => {
          let tempCollectionCanAcceptFalse
          before(async function () {
            tempCollectionCanAcceptFalse = await utils.createTempCollection({
              name: 'temoCollection',
              description: 'Collection TEST description',
              settings: {
                fields: {
                  detail: {
                    enabled: 'always',
                    required: 'findings'
                  },
                  comment: {
                    enabled: 'always',
                    required: 'findings'
                  }
                },
                status: {
                  canAccept: false,
                  minAcceptGrant: 2,
                  resetCriteria: 'result'
                },
                history: {
                  maxReviews: 11
                }
              },
              metadata: {
                pocName: 'poc2Put',
                pocEmail: 'pocEmailPut@email.com',
                pocPhone: '12342',
                reqRar: 'true'
              },
              grants: [
                {
                  userId: '1',
                  roleId: 4
                },
                {
                  userId: '85',
                  roleId: 1
                }
              ],
              labels: [
                {
                  name: 'TEST',
                  description: 'Collection label description',
                  color: 'ffffff'
                }
              ]
            })
          })

          after(async function () {
            await utils.deleteCollection(tempCollectionCanAcceptFalse.collectionId)
          })

          it(`should throw SmError.PriviledgeError`, async () => {

            const postreview = {
              source: {
                review: {
                  status: 'accepted'
                }
              },
              assets: {
                assetIds: ['62', '42', '154']
              },
              rules: {
                benchmarkIds: ['VPN_SRG_TEST_Batch']
              }
            }
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${tempCollectionCanAcceptFalse.collectionId}/reviews`, 'POST', iteration.token, postreview)
            
            expect(res.status).to.eql(403)
          })
          it(`should throw SmError.PriviledgeError`, async () => {

            const postreview = {
              source: {
                review: {
                  status: 'accepted'
                }
              },
              assets: {
                assetIds: ['62', '42', '154']
              },
              rules: {
                benchmarkIds: ['VPN_SRG_TEST_Batch']
              }
            }
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${tempCollectionCanAcceptFalse.collectionId}/reviews`, 'POST', iteration.token, postreview)
            expect(res.status).to.eql(403)
          })
          it("should throw SmError.PriviledgeError, lvl1 user no acccess to asset ", async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ["29"]
                },
                rules: {
                  ruleIds: ['SV-106179r1_rule']
                }
              })

            expect(res.status).to.eql(200)
            if(iteration.name === "lvl1"){
              expect(res.body.failedValidation).to.eql(1)
              expect(res.body.validationErrors[0].error).to.eql("no grant for this asset/ruleId")
              expect(res.body.validationErrors[0].assetId).to.eql("29")
            }
            else 
            {
              expect(res.body.failedValidation).to.eql(0)
            }
          })
          it("should throw error, user cannot accept/reject reviews in colleciton ", async () => {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews`, 'POST', iteration.token, {
                source: {
                  review: {
                    status: 'accepted'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
                },
                rules: {
                  ruleIds: ['SV-106179r1_rule']
                }
              })

            if(distinct.roleId < 3){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
          })
        })
      })
      describe('POST - postReviewsByAsset - /collections/{collectionId}/reviews/{assetId}', () => {

        let deletedCollection = reference.deletedCollection.collectionId
        let deletedAsset = reference.deletedAsset.assetId
        before(async function () {
          await utils.loadAppData()
          await utils.deleteReview(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testCollection.ruleId)
        })

        it('Import one or more Reviews from a JSON body new ruleId', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`, 'POST', iteration.token, [
              {
              "ruleId": reference.testCollection.ruleId,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          const expectedResponse = {
            rejected: [],
            affected: {
                inserted: 1,
                updated: 0
            }
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          expect(res.body).to.deep.equal(expectedResponse)
        })
        it("Import review for an asset, asset is read only for lvl1 user, expect rejection.", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testCollection.lvl1ReadOnlyAssetId}`, 'POST', iteration.token, [
              {
              "ruleId": reference.testCollection.ruleId,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          
          expect(res.status).to.eql(200)
          if(iteration.name == "lvl1"){
            expect(res.body.rejected).to.have.length(1)
            expect(res.body.rejected[0].reason).to.eql("no grant for this asset/ruleId")
            expect(res.body.affected.inserted).to.eql(0)
            expect(res.body.affected.updated).to.eql(0)
          }
          else {
            expect(res.body.rejected).to.have.length(0)
            expect(res.body.affected.inserted).to.eql(0)
            expect(res.body.affected.updated).to.eql(1)
          }

        })
        it('Import one or more Reviews from a JSON body already used ruleId should be an update', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`, 'POST', iteration.token, [
              {
              "ruleId": `${reference.testCollection.ruleId}`,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          const expectedResponse = {
            rejected: [],
            affected: {
                inserted: 0,
                updated: 1
            }
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          expect(res.body).to.deep.equal(expectedResponse)
        })
        it('Import reviews for asset in deleted collection and deleted asset', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${deletedCollection}/reviews/${deletedAsset}`, 'POST', iteration.token, [
              {
              "ruleId": `${reference.testCollection.ruleId}`,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          expect(res.status).to.eql(403) 
        })
        it('Import reviews for asset in deleted collection', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${deletedCollection}/reviews/${reference.testAsset.assetId}`, 'POST', iteration.token, [
              {
              "ruleId": `${reference.testCollection.ruleId}`,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          expect(res.status).to.eql(403) 
        })
        it('Import reviews for deleted asset', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${deletedCollection}/reviews/${reference.testAsset.assetId}`, 'POST', iteration.token, [
              {
              "ruleId": `${reference.testCollection.ruleId}`,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          expect(res.status).to.eql(403) 
        })
      })
    })
  }
})
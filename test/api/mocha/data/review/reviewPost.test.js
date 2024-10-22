const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies.js')
const checkReviews = (reviews, postreview, iteration) => {
  for(let review of reviews){
    if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
      if (postreview.action == "insert") {
         expect(review.resultEngine).to.not.eql(null);
         expect(review.status.user.username).to.eql("admin");
      }else{
        expect(review.resultEngine).to.eql(null)
        expect(review.status.label).to.eql("saved")
        expect(review.status.user.username).to.eql(iteration.name)
        expect(review.username).to.eql(iteration.name)
        expect(review.result).to.eql(postreview.source.review.result)
        expect(review.detail).to.eql(postreview.source.review.detail)
      }
    }
    else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
      if (postreview.action == "insert") {
        expect(review.status.user.username).to.eql("admin");
        expect(review.username).to.eql("admin");              
        expect(review.detail).to.eql("test");
      }
      else {
        expect(review.resultEngine).to.eql(null)
        expect(review.status.label).to.eql("submitted")
        expect(review.status.user.username).to.eql("admin")
        expect(review.username).to.eql(iteration.name)
        expect(review.result).to.eql(postreview.source.review.result)
        expect(review.detail).to.eql(postreview.source.review.detail)
      }
   }
   else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
      if (postreview.action == "insert") {
        expect(review.resultEngine).to.eql(null);
      }
      else {
        expect(review.resultEngine).to.eql(null)
      }
      expect(review.status.label).to.eql("saved")
      expect(review.status.user.username).to.eql(iteration.name)
      expect(review.username).to.eql(iteration.name)
      expect(review.result).to.eql(postreview.source.review.result)
      expect(review.detail).to.eql(postreview.source.review.detail)
    }
  }
}

describe('POST - Review', () => {
  
  before(async function () {
      await utils.uploadTestStigs()
  })

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
      continue
    }
    describe(`iteration:${iteration.name}`, () => {
      const distinct = expectations[iteration.name]
      describe('POST - postReviewBatch - /collections/{collectionId}/reviews', () => {
        describe(`Batch Review Editing`, () => {

            beforeEach(async function () {
              this.timeout(4000)
                // await utils.uploadTestStigs()
                await utils.loadAppData("batch-test-data.jsonl")
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
                  assetIds: ['62', '42', '154']
                },
                rules: {
                  benchmarkIds: ['VPN_SRG_TEST']
                }
              }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
              
              expect(res).to.have.status(200)
            
              const reviews = await utils.getReviews(reference.testCollection.collectionId)
            
              expect(res.body.inserted).to.eql(distinct.postReviews.targetAssetsWholeStig.inserted)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetAssetsWholeStig.failedValidation)
              expect(res.body.updated).to.eql(distinct.postReviews.targetAssetsWholeStig.updated)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetAssetsWholeStig.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetAssetsWholeStig.reviewsLength)

              for(let review of reviews){
                if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
                  if (postreview.action == "insert") {
                      expect(review.resultEngine).to.not.eql(null);
                      expect(review.status.user.username).to.eql("admin");
                  }else{
                    expect(review.resultEngine).to.eql(null)
                    expect(review.status.label).to.eql("saved")
                    expect(review.status.user.username).to.eql(iteration.name)
                    expect(review.username).to.eql(iteration.name)
                    expect(review.result).to.eql(postreview.source.review.result)
                    expect(review.detail).to.eql(postreview.source.review.detail)
                  }
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                  if (postreview.action == "insert") {
                    expect(review.status.user.username).to.eql("admin");
                    expect(review.username).to.eql("admin");              
                    expect(review.detail).to.eql("test");
                  }
                  else {
                    expect(review.resultEngine).to.eql(null)
                    expect(review.status.label).to.eql("submitted")
                    expect(review.status.user.username).to.eql("admin")
                    expect(review.username).to.eql(iteration.name)
                    expect(review.result).to.eql(postreview.source.review.result)
                    expect(review.detail).to.eql(postreview.source.review.detail)
                  }
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
                  if (postreview.action == "insert") {
                    expect(review.resultEngine).to.eql(null);
                  }
                  else {
                    expect(review.resultEngine).to.eql(null)
                  }
                  expect(review.status.label).to.eql("saved")
                  expect(review.status.user.username).to.eql(iteration.name)
                  expect(review.username).to.eql(iteration.name)
                  expect(review.result).to.eql(postreview.source.review.result)
                  expect(review.detail).to.eql(postreview.source.review.detail)
                }
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
                  assetIds: ['62', '42', '154']
                },
                rules: {
                    ruleIds: ['SV-106179r1_rule']
                  }
                
              }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
              
              expect(res).to.have.status(200)

              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              
              expect(res.body.inserted).to.eql(distinct.postReviews.targetAssetsOneRule.inserted)
              expect(res.body.updated).to.eql(distinct.postReviews.targetAssetsOneRule.updated)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetAssetsOneRule.failedValidation)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetAssetsOneRule.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetAssetsOneRule.reviewsLength)

              for(let review of reviews){
                if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
                  if (postreview.action == "insert") {
                      expect(review.resultEngine).to.not.eql(null);
                      expect(review.status.user.username).to.eql("admin");
                  }else{
                    expect(review.resultEngine).to.eql(null)
                    expect(review.status.label).to.eql("saved")
                    expect(review.status.user.username).to.eql(iteration.name)
                    expect(review.username).to.eql(iteration.name)
                    expect(review.result).to.eql(postreview.source.review.result)
                    expect(review.detail).to.eql(postreview.source.review.detail)
                  }
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                  if (postreview.action == "insert") {
                    expect(review.status.user.username).to.eql("admin");
                    expect(review.username).to.eql("admin");              
                    expect(review.detail).to.eql("test");
                  }
                  else {
                    expect(review.resultEngine).to.eql(null)
                    expect(review.status.label).to.eql("submitted")
                    expect(review.status.user.username).to.eql("admin")
                    expect(review.username).to.eql(iteration.name)
                    expect(review.result).to.eql(postreview.source.review.result)
                    expect(review.detail).to.eql(postreview.source.review.detail)
                  }
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
                  if (postreview.action == "insert") {
                    expect(review.resultEngine).to.eql(null);
                  }
                  else {
                    expect(review.resultEngine).to.eql(null)
                  }
                  expect(review.status.label).to.eql("saved")
                  expect(review.status.user.username).to.eql(iteration.name)
                  expect(review.username).to.eql(iteration.name)
                  expect(review.result).to.eql(postreview.source.review.result)
                  expect(review.detail).to.eql(postreview.source.review.detail)
                }
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
                  benchmarkIds: ['VPN_SRG_TEST']
                },
                rules: {
                    ruleIds: ['SV-106179r1_rule']
                  }
                }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
          
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')
              const reviews = await utils.getReviews(reference.testCollection.collectionId)

              expect(res.body.inserted).to.eql(distinct.postReviews.targetAssetsAndRule.inserted)
              expect(res.body.updated).to.eql( distinct.postReviews.targetAssetsAndRule.updated)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetAssetsAndRule.failedValidation)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetAssetsAndRule.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetAssetsAndRule.reviewsLength)

              checkReviews(reviews, postreview, iteration)
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
                  benchmarkIds: ['VPN_SRG_TEST']
                },
                rules: {
                    benchmarkIds: ['VPN_SRG_TEST']
                  }
                }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
            
              expect(res).to.have.status(200)
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
            
              checkReviews(reviews, postreview, iteration)
            })
            it(`POST batch review: target stig, whole stig - ACTION: insert`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
                },
                rules: {
                    ruleIds: ['SV-106179r1_rule']
                  },
                  action: "insert"
                }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
            
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')

              const reviews = await utils.getReviews(reference.testCollection.collectionId)

              expect(res.body.inserted).to.eql(distinct.postReviews.targetStigWholeStigInsert.inserted)
              expect(res.body.updated).to.eql(distinct.postReviews.targetStigWholeStigInsert.updated)
              expect(res.body.failedValidation).to.eql(distinct.postReviews.targetStigWholeStigInsert.failedValidation)
              expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetStigWholeStigInsert.validationErrors)
              expect(reviews).to.have.lengthOf(distinct.postReviews.targetStigWholeStigInsert.reviewsLength)
              
              checkReviews(reviews, postreview, iteration)
            })
            it(`POST batch review: target stig, whole stig - ACTION: merge`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
                },
                rules: {
                    ruleIds: ['SV-106179r1_rule']
                  },
                  action: "update"
                }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
             
              expect(res).to.have.status(200)
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
                if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
                  expect(review.resultEngine).to.eql(null)
                  expect(review.status.label).to.eql("saved")
                  expect(review.status.user.username).to.eql(iteration.name)
                  expect(review.username).to.eql(iteration.name)
                  expect(review.result).to.eql(postreview.source.review.result)
                  expect(review.detail).to.eql(postreview.source.review.detail)
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                  expect(review.resultEngine).to.eql(null)
                  expect(review.status.label).to.eql("submitted")
                
                  expect(review.status.user.username).to.eql("admin")
                  expect(review.username).to.eql(iteration.name)
                  expect(review.result).to.eql(postreview.source.review.result)
                  expect(review.detail).to.eql(postreview.source.review.detail)
              }
              else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
                  expect(review.status.label).to.eql("saved")
                  expect(review.status.user.username).to.eql(iteration.name)
                  expect(review.username).to.eql(iteration.name)
                  expect(review.result).to.eql(postreview.source.review.result)
                  expect(review.detail).to.eql(postreview.source.review.detail)
                }
              }
            })
            it(`POST batch review: update but with exclusionary updateFilters (request should do nothing)`, async () => {
              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
                },
                rules: {
                  ruleIds: ['SV-106179r1_rule']
                },
                updateFilters: [
                  {
                    field: 'result',
                    value: 'informational'
                  }
                ],
                action: 'update'
              }


              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
             
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')

              expect(res.body.inserted).to.eql(0)
              expect(res.body.updated).to.eql(0)
              expect(res.body.failedValidation).to.eql(0)
              expect(res.body.validationErrors).to.have.length(0)

              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              expect(reviews).to.have.lengthOf(2)
              
              for(let review of reviews){
                expect(review.detail).to.not.eql(postreview.source.review.detail)
              }
            })
            it(`POST batch review: update -  updateFilters - admins reviews only`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
                },
                rules: {
                  ruleIds: ['SV-106179r1_rule']
                },
                updateFilters: [
                  {
                    field: 'userId',
                    value: '87'
                  }
                ],
                action: 'update'
                }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
            
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')

              expect(res.body.inserted).to.eql(0)
              expect(res.body.updated).to.eql(2)
              expect(res.body.failedValidation).to.eql(0)
              expect(res.body.validationErrors).to.have.length(0)

              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              
              expect(reviews).to.have.lengthOf(2)

              for(let review of reviews){
                if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
                  expect(review.resultEngine).to.eql(null);
                  expect(review.status.label).to.eql("saved");
                  expect(review.status.user.username).to.eql(iteration.name)
                  expect(review.username).to.eql(iteration.name);
                  expect(review.result).to.eql(postreview.source.review.result);
                  expect(review.detail).to.eql(postreview.source.review.detail);
                
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                  expect(review.resultEngine).to.eql(null);
                  expect(review.status.label).to.eql("submitted");
                  expect(review.status.user.username).to.eql("admin");
                  expect(review.username).to.eql(iteration.name);
                  expect(review.result).to.eql(postreview.source.review.result);
                  expect(review.detail).to.eql(postreview.source.review.detail);
              }
              else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
                expect(review.resultEngine).to.eql(null);
                expect(review.status.label).to.eql("saved");
                expect(review.status.user.username).to.eql(iteration.name);
                expect(review.username).to.eql(iteration.name);
                expect(review.result).to.eql(postreview.source.review.result);
                expect(review.detail).to.eql(postreview.source.review.detail);
                }
              }
            })
            it(`POST batch review: update - updateFilters- before date`, async () => {

              const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
                },
                rules: {
                  ruleIds: ['SV-106179r1_rule']
                },
                updateFilters: [
                  {
                  field: "ts",
                  condition : "lessThan",
                  value: "2022-10-26T22:37:46Z"
                  }
                ],
                action: 'update'
                }

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
              
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')

              expect(res.body.inserted).to.eql(0)
              expect(res.body.updated).to.eql(1)
              expect(res.body.failedValidation).to.eql(0)
              expect(res.body.validationErrors).to.have.length(0)

              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              expect(reviews).to.have.lengthOf(2)

              for(let review of reviews){
              
                if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
                  expect(review.resultEngine).to.eql(null)
                  expect(review.status.label).to.eql("saved")
                  expect(review.status.user.username).to.eql(iteration.name)
                  expect(review.username).to.eql(iteration.name)
                  expect(review.result).to.eql(postreview.source.review.result)
                  expect(review.detail).to.eql(postreview.source.review.detail)
                
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                  expect(review.resultEngine).to.eql(null)
                  expect(review.status.label).to.eql("submitted")
                  expect(review.status.user.username).to.eql("admin")
                  expect(review.username).to.eql("admin")
              }
              else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
                expect(review.resultEngine).to.eql(null);
                expect(review.status.label).to.eql("saved");
                expect(review.status.user.username).to.eql(iteration.name);
                expect(review.username).to.eql(iteration.name);
                expect(review.result).to.eql(postreview.source.review.result);
                expect(review.detail).to.eql(postreview.source.review.detail);
                }
              }
            })
            it(`POST batch review: update with updateFilters - detail string "batch"`, async () => {

            const postreview = {
                source: {
                  review: {
                    result: 'fail',
                    detail: 'tesetsetset'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
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


              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
            
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')

              expect(res.body.inserted).to.eql(0)
              expect(res.body.updated).to.eql(1)
              expect(res.body.failedValidation).to.eql(0)
              expect(res.body.validationErrors).to.have.length(0)

              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              expect(reviews).to.have.lengthOf(2)

              for(let review of reviews){
              
                if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
                  expect(review.resultEngine).to.eql(null)
                  expect(review.status.label).to.eql("saved")
                  expect(review.status.user.username).to.eql(iteration.name)
                  expect(review.username).to.eql(iteration.name)
                  expect(review.result).to.eql(postreview.source.review.result)
                  expect(review.detail).to.eql(postreview.source.review.detail)
                
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                  expect(review.resultEngine).to.eql(null)
                  expect(review.status.label).to.eql("submitted")
                  expect(review.status.user.username).to.eql("admin")
                  expect(review.username).to.eql("admin")
                  expect(review.detail).to.eql("test")
              }
              else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
                expect(review.resultEngine).to.eql(null);
                expect(review.status.label).to.eql("saved");
                expect(review.status.user.username).to.eql(iteration.name);
                expect(review.username).to.eql(iteration.name);
                expect(review.result).to.eql(postreview.source.review.result);
                expect(review.detail).to.eql(postreview.source.review.detail);
                }
              }
            })
            it(`POST batch review: update - updateFilters- only non-saved status`, async () => {

            const postreview = {
                source: {
                  review: {
                    status: 'saved'
                  }
                },
                assets: {
                  assetIds: ['62', '42', '154']
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

              const res = await chai.request(config.baseUrl)
                .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(postreview)
            
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('object')
              expect(res.body).to.have.property('failedValidation')
              expect(res.body).to.have.property('updated')
              expect(res.body).to.have.property('inserted')

              expect(res.body.inserted).to.eql(0)
              expect(res.body.updated).to.eql(2)
              expect(res.body.failedValidation).to.eql(0)
              expect(res.body.validationErrors).to.have.length(0)

              const reviews = await utils.getReviews(reference.testCollection.collectionId)
              expect(reviews).to.have.lengthOf(2)

              for(let review of reviews){
                  expect(review.status.label).to.eql("saved")
                  expect(review.status.user.username).to.eql(iteration.name)
              }
            })
            it(`POST batch review: update with updateFilters - pass only`, async () => {
                const postreview = {
                  source: {
                    review: {
                      result: 'fail',
                      detail: 'tesetsetset'
                    }
                  },
                  assets: {
                    assetIds: ['62', '42', '154']
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

                const res = await chai.request(config.baseUrl)
                  .post(`/collections/${reference.testCollection.collectionId}/reviews`)
                  .set('Authorization', `Bearer ${iteration.token}`)
                  .send(postreview)
              
                expect(res).to.have.status(200)
                expect(res.body).to.be.an('object')
                expect(res.body).to.have.property('failedValidation')
                expect(res.body).to.have.property('updated')
                expect(res.body).to.have.property('inserted')
        
                expect(res.body.inserted).to.eql(0)
                expect(res.body.updated).to.eql(1)
                expect(res.body.failedValidation).to.eql(0)
                expect(res.body.validationErrors).to.have.length(0)
        
                const reviews = await utils.getReviews(reference.testCollection.collectionId)
                expect(reviews).to.have.lengthOf(2)
        
                for(let review of reviews){
              
                  if(review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){
                    expect(review.resultEngine).to.eql(null)
                    expect(review.status.label).to.eql("saved")
                    expect(review.status.user.username).to.eql(iteration.name)
                    expect(review.username).to.eql(iteration.name)
                    expect(review.result).to.eql(postreview.source.review.result)
                    expect(review.detail).to.eql(postreview.source.review.detail)
                  
                  }
                  else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                    expect(review.resultEngine).to.eql(null)
                    expect(review.status.label).to.eql("submitted")
                    expect(review.status.user.username).to.eql("admin")
                    expect(review.username).to.eql("admin")
                    expect(review.detail).to.eql("test")
                }
                else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
                  expect(review.resultEngine).to.eql(null);
                  expect(review.status.label).to.eql("saved");
                  expect(review.status.user.username).to.eql(iteration.name);
                  expect(review.username).to.eql(iteration.name);
                  expect(review.result).to.eql(postreview.source.review.result);
                  expect(review.detail).to.eql(postreview.source.review.detail);
                  }
                }
            })
        })
        describe(`Batch Review Editing - Validation Errors, expect failure. `, () => {
              
          beforeEach(async function () {
            this.timeout(4000)
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
                  assetIds: ['62', '42', '154']
                },
                rules: { ruleIds: ['SV-106179r1_rule'] }
              }

            const res = await chai.request(config.baseUrl)
              .post(`/collections/${reference.testCollection.collectionId}/reviews`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send(postreview)
          
            expect(res).to.have.status(200)

            expect(res.body.inserted).to.eql(0)
            expect(res.body.updated).to.eql(0)
            expect(res.body.failedValidation).to.eql(3)
            expect(res.body.validationErrors).to.have.length(3)
                  
            if (iteration.name == "lvl1"){
              for (review of res.body.validationErrors){
                  expect(review.error).to.be.oneOf(["status is not allowed for the result","no grant for this asset/ruleId"])
                  if (review.assetId == 62) {
                      expect(review.error).to.eql("no grant for this asset/ruleId")                
                  }
              }
            }
            else {
              for (review of res.body.validationErrors){
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
                benchmarkIds: ['VPN_SRG_TEST']
              },
              rules: { ruleIds: ['SV-106179r1_rule'] }
            }

          const res = await chai.request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/reviews`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send(postreview)
      
          expect(res).to.have.status(200)
          const reviews = await utils.getReviews(reference.testCollection.collectionId)

          expect(res.body.inserted).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.inserted)
          expect(res.body.updated).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.updated)
          expect(res.body.failedValidation).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.failedValidation)
          expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetByStigOneRuleValidationFailure.validationErrors)
          expect(reviews).to.have.lengthOf(distinct.postReviews.targetByStigOneRuleValidationFailure.reviewsLength)
        
          for (let review of reviews){
            if (review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){ 
              // CASE: Existing review, test reset of resultengine and status - all users can update
                expect(review.status.label).to.eql("submitted");
                expect(review.status.user.username).to.eql("admin");
                expect(review.username).to.eql("admin");
                expect(review.result).to.eql("pass");
            }
            // CASE: Existing review, test reset of resultengine and status - all users can update
            else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                expect(review.resultEngine).to.eql(null);
                expect(review.status.label).to.eql("submitted");
                expect(review.status.user.username).to.eql("admin");
                expect(review.username).to.eql("admin");
                expect(review.result).to.eql("fail");
            }
          // CASE: new  review, test reset of resultengine and status - non-lvl1-can update
          else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
              expect(review.resultEngine).to.eql(null);
              expect(review.status.label).to.eql("saved");
              expect(review.status.user.username).to.eql(iteration.name);
              expect(review.username).to.eql(iteration.name);
              expect(review.result).to.eql(postreview.source.review.result);
              expect(review.detail).to.eql(postreview.source.review.detail);
            }
          }
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
                  benchmarkIds: ['VPN_SRG_TEST']
                },
                rules: { ruleIds: ['SV-106179r1_rule'] }
              }

          const res = await chai.request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/reviews`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send(postreview)
          
          expect(res).to.have.status(200)
          
          const reviews = await utils.getReviews(reference.testCollection.collectionId)
      
          expect(res.body.inserted).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.inserted)
          expect(res.body.updated).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.updated)
          expect(res.body.failedValidation).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.failedValidation)
          expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetByStigOneRuleValidationFailure.validationErrors)
          expect(reviews).to.have.lengthOf(distinct.postReviews.targetByStigOneRuleValidationFailure.reviewsLength)

          for (let review of reviews){
            if (review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){ 
              // CASE: Existing review, test reset of resultengine and status - all iterations can update
                expect(review.status.label).to.eql("submitted");
                expect(review.status.user.username).to.eql("admin");
                expect(review.username).to.eql("admin");
                expect(review.result).to.eql("pass");
            }
            // CASE: Existing review, test reset of resultengine and status - all iterations can update
            else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
                expect(review.resultEngine).to.eql(null);
                expect(review.status.label).to.eql("submitted");
                expect(review.status.user.username).to.eql("admin");
                expect(review.username).to.eql("admin");
                expect(review.result).to.eql("fail");
            }
          // CASE: new  review, test reset of resultengine and status - non-lvl1-can update
          else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
              expect(review.resultEngine).to.eql(null);
              expect(review.status.label).to.eql("saved");
              expect(review.status.user.username).to.eql(iteration.name);
              expect(review.username).to.eql(iteration.name);
              expect(review.result).to.eql(postreview.source.review.result);
              expect(review.detail).to.eql(postreview.source.review.detail);
            }
          }
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
                benchmarkIds: ['VPN_SRG_TEST']
              },
              rules: { ruleIds: ['SV-106179r1_rule'] }
            }

        const res = await chai.request(config.baseUrl)
          .post(`/collections/${reference.testCollection.collectionId}/reviews`)
          .set('Authorization', `Bearer ${iteration.token}`)
          .send(postreview)
        
        expect(res).to.have.status(200)
        const reviews = await utils.getReviews(reference.testCollection.collectionId)
    
        expect(res.body.inserted).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.inserted)
        expect(res.body.updated).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.updated)
        expect(res.body.failedValidation).to.eql(distinct.postReviews.targetByStigOneRuleValidationFailure.failedValidation)
        expect(res.body.validationErrors).to.have.length(distinct.postReviews.targetByStigOneRuleValidationFailure.validationErrors)
        expect(reviews).to.have.lengthOf(distinct.postReviews.targetByStigOneRuleValidationFailure.reviewsLength)
      
        for (let review of reviews){
          if (review.ruleId == reference.testCollection.ruleId && review.assetId == reference.testAsset.assetId){ 
            // CASE: Existing review, test reset of resultengine and status - all iterations can update
              expect(review.status.label).to.eql("submitted");
              expect(review.status.user.username).to.eql("admin");
              expect(review.username).to.eql("admin");
              expect(review.result).to.eql("pass");
          }
          // CASE: Existing review, test reset of resultengine and status - all iterations can update
          else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 154) {
              expect(review.resultEngine).to.eql(null);
              expect(review.status.label).to.eql("submitted");
              expect(review.status.user.username).to.eql("admin");
              expect(review.username).to.eql("admin");
              expect(review.result).to.eql("fail");
        }
        // CASE: new  review, test reset of resultengine and status - non-lvl1-can update
        else if (review.ruleId == reference.testCollection.ruleId && review.assetId == 62) {
            expect(review.resultEngine).to.eql(null);
            expect(review.status.label).to.eql("saved");
            expect(review.status.user.username).to.eql(iteration.name);
            expect(review.username).to.eql(iteration.name);
            expect(review.result).to.eql(postreview.source.review.result);
            expect(review.detail).to.eql(postreview.source.review.detail);
          }
        }
          })
        })
        describe('Batch Review Editing - In code errors', () => {
          let tempCollectionCanAcceptFalse
          before(async function () {
            this.timeout(4000)
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
                  accessLevel: 4
                },
                {
                  userId: '85',
                  accessLevel: 1
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
            await utils.deleteCollection(tempCollectionCanAcceptFalse.data.collectionId)
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
                benchmarkIds: ['VPN_SRG_TEST']
              }
            }
            const res = await chai.request(config.baseUrl)
              .post(`/collections/${tempCollectionCanAcceptFalse.data.collectionId}/reviews`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send(postreview)
            
            expect(res).to.have.status(403)
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
                benchmarkIds: ['VPN_SRG_TEST']
              }
            }
            const res = await chai.request(config.baseUrl)
              .post(`/collections/${tempCollectionCanAcceptFalse.data.collectionId}/reviews`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send(postreview)
            expect(res).to.have.status(403)
          })
        })
      })
      describe('POST - postReviewsByAsset - /collections/{collectionId}/reviews/{assetId}', () => {

        let deletedCollection, deletedAsset
        before(async function () {
          this.timeout(4000)
          //await utils.putReviewByAssetRule(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testCollection.ruleId, requestBodies.requestBodies)
          await utils.deleteReviewsByAssetRule(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testCollection.ruleId)
          const deletedItems = await utils.createDisabledCollectionsandAssets()
          deletedCollection = deletedItems.collection
          deletedAsset = deletedItems.asset
        })

        it('Import one or more Reviews from a JSON body new ruleId', async () => {
          const res = await chai.request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send([
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
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object')
          expect(res.body).to.deep.equal(expectedResponse)
        })
        it('Import one or more Reviews from a JSON body already used ruleId should be an update', async () => {
          const res = await chai.request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send([
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
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object')
          expect(res.body).to.deep.equal(expectedResponse)
        })
        it('Import reviews for asset in deleted collection and deleted asset', async () => {
          const res = await chai.request(config.baseUrl)
            .post(`/collections/${deletedCollection.collectionId}/reviews/${deletedAsset.assetId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send([
              {
              "ruleId": `${reference.testCollection.ruleId}`,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          expect(res).to.have.status(403) 
        })
        it('Import reviews for asset in deleted collection', async () => {
          const res = await chai.request(config.baseUrl)
            .post(`/collections/${deletedCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send([
              {
              "ruleId": `${reference.testCollection.ruleId}`,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          expect(res).to.have.status(403) 
        })
        it('Import reviews for deleted asset', async () => {
          const res = await chai.request(config.baseUrl)
            .post(`/collections/${deletedCollection.collectionId}/reviews/${reference.testAsset.assetId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send([
              {
              "ruleId": `${reference.testCollection.ruleId}`,
              "result": "pass",
              "detail": "test\nvisible to lvl1",
              "comment": "sure",
              "autoResult": false,
              "status": "submitted"
              }
          ])
          expect(res).to.have.status(403) 
        })
      })
    })
  }
})
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const reference = require('../../referenceData.js')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const requestBodies = require('./requestBodies.js')

describe('PATCH - Review', () => {

  before(async function () {
      this.timeout(4000)
      await utils.loadAppData()
      await utils.uploadTestStigs()
  })
  
  for(const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
      continue
    }
    describe(`iteration:${iteration.name}`, () => {
      const distinct = expectations[iteration.name]
      describe('PATCH - patchReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {

        beforeEach(async function () {
          await utils.putReviewByAssetRule(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testCollection.ruleId, requestBodies.resetRule)
        })

        it('PATCH Review with new details, expect status to remain', async () => {
          const res = await chai.request(config.baseUrl)
            .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send({detail:"these details have changed, but the status remains"})
       
          expect(res).to.have.status(200)
          expect(res.body.status).to.have.property('label').that.equals('submitted')
        })
        it('PATCH Review with new result, expect status to reset to saved', async () => {
            const res = await chai.request(config.baseUrl)
              .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({result: "pass"})
           
            expect(res).to.have.status(200)
            expect(res.body.result).to.eql("pass")
            expect(res.body.status).to.have.property('label').that.equals('saved')
        })
        it('PATCH Review to submitted status', async () => {
            const res = await chai.request(config.baseUrl)
              .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({status: "submitted"})
           
            expect(res).to.have.status(200)
            expect(res.body.status).to.have.property('label').that.equals('submitted')
        })
        it('PATCH Review patched and no longer meets Collection Requirements', async () => {
            const res = await chai.request(config.baseUrl)
              .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send({result: "fail"})
           
            expect(res).to.have.status(200)
            expect(res.body.result).to.eql("fail")
            expect(res.body.status).to.have.property('label').that.equals('saved')
        })
        it('PATCH Review to Accepted', async () => {
          const res = await chai.request(config.baseUrl)
            .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send({status: "accepted"})
          
          if(iteration.name === "lvl1" || iteration.name === "lvl2") {
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body).to.have.property("touchTs").to.eql(res.body.status.ts)
        })
        it('Merge provided properties with a Review', async () => {
          const res = await chai
            .request(config.baseUrl)
            .patch(
              `/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send({
              result: "pass",
              detail: "test\nvisible to lvl1",
              comment: "sure",
              status: "submitted",
            })
          
          expect(res).to.have.status(200)
          expect(res.body.status.label).to.eql("submitted")    
          expect(res.body.result).to.eql("pass")
          expect(res.body.detail).to.eql("test\nvisible to lvl1")
          expect(res.body.comment).to.eql("sure")
        })
      })
      describe('PATCH - patchReviewMetadata - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata', () => {

        it('Merge metadata property/value into a Review', async () => {
          const res = await chai.request(config.baseUrl)
            .patch(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
        
          expect(res).to.have.status(200)
          expect(res.body).to.eql({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
        
        })
        it("should return SmError.PrivilegeError if user cannot modify review", async () => {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.scrapRuleIdWindows10}/metadata`)
            .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canPatchReview){
            expect(res).to.have.status(200)
            return
          }
          expect(res).to.have.status(403)
          expect(res.body.error).to.be.equal("User has insufficient privilege to complete this request.")
        })
      })
    })
  }
})


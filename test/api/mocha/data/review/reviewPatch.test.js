
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { expect } from 'chai'

describe('PATCH - Review', () => {

  before(async function () {
      await utils.loadAppData()
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', iteration.token, {detail:"these details have changed, but the status remains"})
       
          expect(res.status).to.eql(200)
          expect(res.body.status).to.have.property('label').that.equals('submitted')
        })
        it('PATCH Review with new result, expect status to reset to saved', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', iteration.token, {result: "pass"})
           
            expect(res.status).to.eql(200)
            expect(res.body.result).to.eql("pass")
            expect(res.body.status).to.have.property('label').that.equals('saved')
        })
        it('PATCH Review to submitted status', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', iteration.token, {status: "submitted"})
           
            expect(res.status).to.eql(200)
            expect(res.body.status).to.have.property('label').that.equals('submitted')
        })
        it('PATCH Review patched and no longer meets Collection Requirements', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', iteration.token, {result: "fail"})
           
            expect(res.status).to.eql(200)
            expect(res.body.result).to.eql("fail")
            expect(res.body.status).to.have.property('label').that.equals('saved')
        })
        it('PATCH Review to Accepted', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', iteration.token, {status: "accepted"})
          
          if(iteration.name === "lvl1" || iteration.name === "lvl2") {
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.have.property("touchTs").to.eql(res.body.status.ts)
        })
        it('Merge provided properties with a Review', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`, 'PATCH', iteration.token, {
              result: "pass",
              detail: "test\nvisible to lvl1",
              comment: "sure",
              status: "submitted",
            })
          
          expect(res.status).to.eql(200)
          expect(res.body.status.label).to.eql("submitted")    
          expect(res.body.result).to.eql("pass")
          expect(res.body.detail).to.eql("test\nvisible to lvl1")
          expect(res.body.comment).to.eql("sure")
        })
        it("patch review that is read only for lvl1 user expect 403 for lvl1 user iteration ", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testCollection.lvl1ReadOnlyAssetId}/${reference.testCollection.ruleId}`, 'PATCH', iteration.token, {
              result: "pass",
              detail: "test\nvisible to lvl1",
              comment: "sure",
              status: "submitted",
            })
          if(iteration.name === "lvl1") {
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
        })
      })
      describe('PATCH - patchReviewMetadata - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata', () => {

        it('Merge metadata property/value into a Review', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PATCH', iteration.token, {[reference.reviewMetadataKey]: reference.reviewMetadataValue})
        
          expect(res.status).to.eql(200)
          expect(res.body).to.eql({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
        
        })
        it("patch review metadata to asset with read only for lvl1 user expect 403 for lvl1 user iteration ", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testCollection.lvl1ReadOnlyAssetId}/${reference.testCollection.ruleId}/metadata`, 'PATCH', iteration.token, {[reference.reviewMetadataKey]: reference.reviewMetadataValue})
          if(iteration.name === "lvl1") {
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)

        })
        it("should return SmError.PrivilegeError if user cannot modify review", async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.scrapRuleIdWindows10}/metadata`, 'GET', iteration.token)
          if(distinct.canPatchReview){
            expect(res.status).to.eql(200)
            return
          }
          expect(res.status).to.eql(403)
          expect(res.body.error).to.be.equal("User has insufficient privilege to complete this request.")
        })
      })
    })
  }
})



import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { expect } from 'chai'

describe('DELETE - Review', () => {

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
      
      describe('DELETE - deleteReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
        let review = null
        beforeEach(async function () {
          review = await utils.importReview(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testAsset.testRuleId)
          await utils.importReview(reference.testCollection.collectionId, reference.testCollection.lvl1ReadOnlyAssetId, reference.testAsset.testRuleId)
        })
        
        it('Delete a Review', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}?projection=rule&projection=history&projection=stigs`, 'DELETE', iteration.token)

          expect(res.status).to.eql(200)
          expect(res.body.assetId).to.equal(reference.testAsset.assetId)
          expect(res.body.rule.ruleId).to.equal(reference.testAsset.testRuleId)
          expect(res.body.stigs).to.be.an('array').of.length(reference.testAsset.testRuleIdStigCount)

          for(const history of res.body.history) {
            expect(history.ruleId).to.equal(reference.testAsset.testRuleId)
          }

          for(const stig of res.body.stigs) { 
            expect(reference.testAsset.validStigs).to.include(stig.benchmarkId)
          }
       
        })

        it("Delete review that is read only for lvl1 user, expect 403 for lvl1 iteration", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testCollection.lvl1ReadOnlyAssetId}/${reference.testAsset.testRuleId}`, 'DELETE', iteration.token)

            if(iteration.name === "lvl1") {
            expect(res.status).to.eql(403)
          }
          else {
            expect(res.status).to.eql(200)
          }
        })
      })

      describe('DELETE - deleteReviewMetadataKey - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys/{key}', () => {

        let review = null
        before(async function () {
          review = await utils.importReview(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testAsset.testRuleId)
        })

        it('should create metadata to be deleted', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'PUT', iteration.token, {[reference.reviewMetadataKey]: reference.reviewMetadataValue})
          expect(res.status).to.eql(200)
          expect(res.body).to.eql({[reference.reviewMetadataKey]: reference.reviewMetadataValue})

        })
        it('Delete one metadata key/value of a Review', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testAsset.testRuleId}/metadata/keys/${reference.reviewMetadataKey}`, 'DELETE', iteration.token, `${JSON.stringify(reference.reviewMetadataValue)}`)
        
          expect(res.status).to.eql(204)
        })
      })
    })
  }
})
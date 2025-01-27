
import { v4 as uuidv4 } from 'uuid'
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { expect } from 'chai'

describe('DELETE - Collection ', function () {

  let tempCollection = null

  for(const iteration of iterations){
    
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`,async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]

      describe('deleteCollection - /collections/{collectionId}', function () {

        before(async function () {
          const testCollectionClone  = JSON.parse(JSON.stringify(requestBodies.resetTestCollection))
          testCollectionClone.name = `Collection ` + utils.getUUIDSubString()
          tempCollection = await utils.createTempCollection(testCollectionClone)
        })

        it('Delete tempCollection collection (stigmanadmin only)',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${tempCollection.collectionId}`, 'DELETE', iteration.token)

          if(distinct.canDeleteCollection === false){ 
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)

          expect(res.body.collectionId).to.equal(tempCollection.collectionId)

          //confirm that it is deleted
          const deletedCollection = await utils.getCollection(tempCollection.collectionId)
          expect(deletedCollection.status, "expect 403 response (delete worked)").to.equal(403)
        })

      })

      describe('deleteCollectionLabelById - /collections/{collectionId}/labels/{labelId}', function () {

        let tempLabel = null
        beforeEach(async function () {
          const labelPost = JSON.parse(JSON.stringify(requestBodies.recreateCollectionLabel))
          labelPost.name = `Label ` + utils.getUUIDSubString(5)
          tempLabel = await utils.createCollectionLabel(reference.testCollection.collectionId, labelPost)
        })
        it('Delete a scrap collection scrap Label',async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${tempLabel.labelId}`, 'DELETE', iteration.token)
            if(distinct.canModifyCollection === false){
                expect(res.status).to.eql(403)
                return
            }
            expect(res.status).to.eql(204)
            const collection = await utils.getCollection(reference.testCollection.collectionId)
            expect(collection.labels).to.not.include(tempLabel.labelId)
        })
        it("should throw SmError.NotFoundError when deleting a non-existent label.",async function () {
          const labelId = uuidv4()
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/labels/${labelId}`, 'DELETE', iteration.token)
          if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
          }
          expect(res.status).to.eql(404)
          expect(res.body.error).to.equal("Resource not found.")
        })
      })

      describe('deleteCollectionMetadataKey - /collections/{collectionId}/metadata/keys/{key}', function () {

        beforeEach(async function () {
          const res = await utils.putCollection(reference.testCollection.collectionId, requestBodies.resetTestCollection)
        })
        it('Delete a scrap collection Metadata Key',async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metadata/keys/${reference.testCollection.collectionMetadataKey}`, 'DELETE', iteration.token)

              if(distinct.canModifyCollection === false){
                expect(res.status).to.eql(403)
                return
              }
              expect(res.status).to.eql(204)
              const collection = await utils.getCollection(reference.testCollection.collectionId)
              expect(collection.metadata).to.not.have.property(reference.testCollection.collectionMetadataKey)
        })
      })

      describe('deleteReviewHistoryByCollection - /collections/{collectionId}/review-history', function () {

        beforeEach(async function () {
          await utils.loadAppData()
        })

        it('Delete review History records - retentionDate',async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?retentionDate=${reference.testCollection.reviewHistory.endDate}`, 'DELETE', iteration.token)
                
            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
  
            expect(res.status).to.eql(200)
            expect(res.body.HistoryEntriesDeleted).to.be.equal(reference.testCollection.reviewHistory.deletedEntriesByDate)
        })
        it('Delete review History records - date and assetId',async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?retentionDate=${reference.testCollection.reviewHistory.endDate}&assetId=${reference.testCollection.testAssetId}`, 'DELETE', iteration.token)

              if(distinct.canModifyCollection === false){
                expect(res.status).to.eql(403)
                return
              }
  
            expect(res.status).to.eql(200)
            expect(res.body.HistoryEntriesDeleted).to.be.equal(reference.testCollection.reviewHistory.deletedEntriesByDateAsset)
        })
      })

      describe('deleteGrantByCollectionGrant - /collections/{collectionId}/grants/{grantId}', function () {

        before(async function () {
          await utils.loadAppData()
        })  
        it('Delete scrap lvl1 bizzaro users grant.  ',async function () {

            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.scrapLvl1User.testCollectionGrantId}`, 'DELETE', iteration.token)
                
            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body.roleId).to.eql(1)
            expect(res.body.grantId).to.eql(reference.scrapLvl1User.testCollectionGrantId)
            expect(res.body.user.userId).to.eql(reference.scrapLvl1User.userId)

        })
        it("Delete an owner grant, is succeeding for all users with roleId owner without elevate.",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.adminBurke.testCollectionGrantId}`, 'DELETE', iteration.token)

          if (distinct.roleId < 4){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
        })

        it("Delete an owner grant, using elevate should only succeed with stigmanadmin",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${"7"}?elevate=true`, 'DELETE', iteration.token)

          if(iteration.name !== "stigmanadmin"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
        })
        it("attempt to delete grant that does not exist expect error",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${"54321"}`, 'DELETE', iteration.token)
          if(distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(404)
        })
      })
    })
  }
})


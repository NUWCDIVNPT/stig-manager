const chai = require('chai')
const chaiHttp = require('chai-http')
const { v4: uuidv4 } = require('uuid');
chai.use(chaiHttp)
const expect = chai.expect
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(deepEqualInAnyOrder)
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations')
const expectations = require('./expectations')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies')

describe('DELETE - Collection ', function () {

  let tempCollection = null

  // before(async function () { 
  //   await utils.loadAppData()
  // })

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
          testCollectionClone.name = `Collection ` + Math.floor(Math.random() * 1000000)
          tempCollection = await utils.createTempCollection(testCollectionClone)
        })

        it('Delete tempCollection collection (stigmanadmin only)',async function () {
          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${tempCollection.data.collectionId}`)
              .set('Authorization', `Bearer ${iteration.token}`)

          if(distinct.canDeleteCollection === false){ 
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)

          expect(res.body.collectionId).to.equal(tempCollection.data.collectionId)

          //confirm that it is deleted
          const deletedCollection = await utils.getCollection(tempCollection.data.collectionId)
          expect(deletedCollection.status, "expect 403 response (delete worked)").to.equal(403)
        })

      })

      describe('deleteCollectionLabelById - /collections/{collectionId}/labels/{labelId}', function () {

        let tempLabel = null
        beforeEach(async function () {
          const labelPost = JSON.parse(JSON.stringify(requestBodies.recreateCollectionLabel))
          labelPost.name = `Label ` + Math.floor(Math.random() * 1000000)
          tempLabel = await utils.createCollectionLabel(reference.testCollection.collectionId, labelPost)
        })
        it('Delete a scrap collection scrap Label',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/labels/${tempLabel.labelId}`)
                .set('Authorization', `Bearer ${iteration.token}`)
            if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
            }
            expect(res).to.have.status(204)
            const collection = await utils.getCollection(reference.testCollection.collectionId)
            expect(collection.labels).to.not.include(tempLabel.labelId)
        })
        it("should throw SmError.NotFoundError when deleting a non-existent label.",async function () {
          const labelId = uuidv4()
          const res = await chai.request(config.baseUrl)
              .delete(`/collections/${reference.scrapCollection.collectionId}/labels/${labelId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
          if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
          }
          expect(res).to.have.status(404)
          expect(res.body.error).to.equal("Resource not found.")
        })
      })

      describe('deleteCollectionMetadataKey - /collections/{collectionId}/metadata/keys/{key}', function () {

        beforeEach(async function () {
          const res = await utils.putCollection(reference.testCollection.collectionId, requestBodies.resetTestCollection)
        })
        it('Delete a scrap collection Metadata Key',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/metadata/keys/${reference.testCollection.collectionMetadataKey}`)
                .set('Authorization', `Bearer ${iteration.token}`)

              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(204)
              const collection = await utils.getCollection(reference.testCollection.collectionId)
              expect(collection.metadata).to.not.have.property(reference.testCollection.collectionMetadataKey)
        })
      })

      describe('deleteReviewHistoryByCollection - /collections/{collectionId}/review-history', function () {

        beforeEach(async function () {
          await utils.loadAppData()
        })

        it('Delete review History records - retentionDate',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/review-history?retentionDate=${reference.testCollection.reviewHistory.endDate}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
  
            expect(res).to.have.status(200)
            expect(res.body.HistoryEntriesDeleted).to.be.equal(reference.testCollection.reviewHistory.deletedEntriesByDate)
        })
        it('Delete review History records - date and assetId',async function () {
            const res = await chai.request(config.baseUrl)
                .delete(`/collections/${reference.testCollection.collectionId}/review-history?retentionDate=${reference.testCollection.reviewHistory.endDate}&assetId=${reference.testCollection.testAssetId}`)
                .set('Authorization', `Bearer ${iteration.token}`)

              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
  
            expect(res).to.have.status(200)
            expect(res.body.HistoryEntriesDeleted).to.be.equal(reference.testCollection.reviewHistory.deletedEntriesByDateAsset)
        })
      })
    })
  }
})


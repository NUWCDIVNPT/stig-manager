const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(deepEqualInAnyOrder)
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require("../../iterations.js")
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies.js')

describe('PUT - Collection', function () {

  before(async function () {
      this.timeout(4000)
      await utils.uploadTestStigs()
  //    await utils.createDisabledCollectionsandAssets()
  })

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`,async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
    
      describe('replaceCollection - /collections/{collectionId}', function () {

        it('Set all properties of a Collection',async function () {

            const putRequest = requestBodies.replaceCollection
            const res = await chai.request(config.baseUrl)
                .put(`/collections/${reference.testCollection.collectionId}?projection=grants&projection=owners&projection=statistics&projection=stigs&projection=assets`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(putRequest)

              if(distinct.canModifyCollection === false){
                  expect(res).to.have.status(403)
                  return
              }
              expect(res).to.have.status(200)

              expect(res.body.description).to.equal("test")
              expect(res.body.name).to.equal("SetAllProperties")
              expect(res.body.settings.fields.detail.enabled).to.equal(putRequest.settings.fields.detail.enabled)
              expect(res.body.settings.fields.detail.required).to.equal(putRequest.settings.fields.detail.required)
              expect(res.body.settings.fields.comment.enabled).to.equal(putRequest.settings.fields.comment.enabled)
              expect(res.body.settings.fields.comment.required).to.equal(putRequest.settings.fields.comment.required)
              expect(res.body.settings.status.canAccept).to.equal(putRequest.settings.status.canAccept)
              expect(res.body.settings.status.minAcceptGrant).to.equal(putRequest.settings.status.minAcceptGrant)
              expect(res.body.settings.status.resetCriteria).to.equal(putRequest.settings.status.resetCriteria)
              expect(res.body.metadata.pocName).to.equal(putRequest.metadata.pocName)
              expect(res.body.metadata.pocEmail).to.equal(putRequest.metadata.pocEmail)
              expect(res.body.metadata.pocPhone).to.equal(putRequest.metadata.pocPhone)
              expect(res.body.metadata.reqRar).to.equal(putRequest.metadata.reqRar)
              
            // grants projection
            expect(res.body.grants).to.have.lengthOf(putRequest.grants.length)
            for(const grant of res.body.grants){
              expect(grant.user.userId).to.be.oneOf(putRequest.grants.map(g => g.userId))
            }
        
            // assets projection
            expect(res.body.assets).to.deep.equalInAnyOrder(reference.testCollection.assetsProjected)

            // owners projection
            expect(res.body.owners).to.have.lengthOf(reference.testCollection.owners.length)

            // statistics projection
            expect(res.body.statistics.assetCount).to.equal(reference.testCollection.assetIds.length)
            expect(res.body.statistics.checklistCount).to.equal(reference.testCollection.statisticsProjected.checklistCount)
            expect(res.body.statistics.grantCount).to.equal(putRequest.grants.length)
        
            // stigs projection
            expect(res.body.stigs).to.have.lengthOf(reference.testCollection.validStigs.length)              
        })

        it("should throw SmError.UnprocessableError when replacing due to duplicate user in grant array.",async function () {

          const putRequest = JSON.parse(JSON.stringify(requestBodies.replaceCollection))
          putRequest.grants.push(putRequest.grants[0])
          putRequest.name = "TEST" + Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100)
          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send(putRequest)
            if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
            }
            expect(res).to.have.status(422)
            expect(res.body.error).to.equal("Unprocessable Entity.")
            expect(res.body.detail).to.equal("Duplicate user in grant array")
        })

        // it('Set all properties of a Collection- with metadata',async function () {

        //     const putRequest = {
        //         name: "TestPutCollection",
        //         settings: {
        //         fields: {
        //             detail: {
        //             enabled: "findings",
        //             required: "findings",
        //             },
        //             comment: {
        //             enabled: "always",
        //             required: "findings",
        //             },
        //         },
        //         status: {
        //             canAccept: true,
        //             minAcceptGrant: 2,
        //             resetCriteria: "result",
        //         },
        //         },

        //         description: "hellodescription",
        //         metadata: {
        //         [reference.testCollection.metadataKey]: reference.testCollection.metadataValue,
        //         },
        //         grants: [
        //         {
        //             userId: "1",
        //             accessLevel: 4,
        //         },
        //         {
        //             userId: "21",
        //             accessLevel: 2,
        //         },
        //         {
        //             userId: "44",
        //             accessLevel: 3,
        //         },
        //         {
        //             userId: "45",
        //             accessLevel: 4,
        //         },
        //         {
        //             userId: "87",
        //             accessLevel: 4,
        //         },
        //         ],
        //     }
      
        //     const res = await chai.request(config.baseUrl)
        //         .put(`/collections/${reference.testCollection.collectionId}?projection=grants&projection=owners&projection=statistics&projection=stigs&projection=assets`)
        //         .set('Authorization', `Bearer ${iteration.token}`)
        //         .send(putRequest    )
        //     if(iteration.name === "lvl1" || iteration.name === "lvl2") {
        //       expect(res).to.have.status(403)
        //       return
        //     } 
        //     expect(res).to.have.status(200)
        //     expect(res.body.description).to.equal("hellodescription")
        //     expect(res.body.name).to.equal("TestPutCollection")
        //     expect(res.body.settings.fields.detail.enabled).to.equal(putRequest.settings.fields.detail.enabled)
        //     expect(res.body.settings.fields.detail.required).to.equal(putRequest.settings.fields.detail.required)
        //     expect(res.body.settings.fields.comment.enabled).to.equal(putRequest.settings.fields.comment.enabled)
        //     expect(res.body.settings.fields.comment.required).to.equal(putRequest.settings.fields.comment.required)
        //     expect(res.body.settings.status.canAccept).to.equal(putRequest.settings.status.canAccept)
        //     expect(res.body.settings.status.minAcceptGrant).to.equal(putRequest.settings.status.minAcceptGrant)
        //     expect(res.body.settings.status.resetCriteria).to.equal(putRequest.settings.status.resetCriteria)
        //     expect(res.body.metadata.testkey).to.equal(reference.testCollection.metadataValue)

        //     // grants projection
        //     expect(res.body.grants).to.have.lengthOf(5)
        //     for(const grant of res.body.grants){
        //       expect(grant.iteration.userId).to.be.oneOf(putRequest.grants.map(g => g.userId))
        //     }
        
        //     // assets projection
        //     expect(res.body.assets).to.have.lengthOf(4)

        //     // owners projection
        //     expect(res.body.owners).to.have.lengthOf(3)

        //     // statistics projection
        //     expect(res.body.statistics.assetCount).to.equal(4)
        //     expect(res.body.statistics.checklistCount).to.equal(6)
        //     expect(res.body.statistics.grantCount).to.equal(5)
        
        //     // stigs projection
        //     expect(res.body.stigs).to.have.lengthOf(2)

        // })

      })

      describe('setStigAssetsByCollectionUser - /collections/{collectionId}/grants/{userId}/access', function () {

        it('set stig-asset grants for a lvl1 user in this collection.',async function () {
          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.scrapCollection.collectionId}/grants/${reference.scrapLvl1User.userId}/access`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send([{
                    "benchmarkId": reference.scrapAsset.scrapBenchmark,
                    "assetId": reference.scrapAsset.assetId,
                }])

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.have.lengthOf(1)
            for(const item of res.body){
                expect(item.benchmarkId).to.equal(reference.scrapAsset.scrapBenchmark)
                expect(item.asset.assetId).to.equal(reference.scrapAsset.assetId)
            }
        })
        it("should throw SmError.NotFoundError when attempting to set asset stig for a user that does not exist with access level 1",async function () {
          const randomUserId = Math.floor(Math.random() * 1002230)
          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.scrapCollection.collectionId}/grants/${randomUserId}/access`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send([{
                    "benchmarkId": reference.scrapAsset.scrapBenchmark,
                    "assetId": reference.scrapAsset.assetId,
                }])
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(404)
            expect(res.body.error).to.equal("Resource not found.")
            expect(res.body.detail).to.equal("User not found in this Collection with accessLevel === 1.")
        })
      })

      describe('putCollectionMetadata - /collections/{collectionId}/metadata', function () {

        it('Set all metadata of a Collection',async function () {

            const putRequest = {
                [reference.testCollection.metadataKey]: reference.testCollection.metadataValue
            }

            const res = await chai.request(config.baseUrl)
                .put(`/collections/${reference.testCollection.collectionId}/metadata`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(putRequest)

              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(200)
            expect(res.body[reference.testCollection.metadataKey]).to.equal(reference.testCollection.metadataValue)
        })
      })

      describe('putCollectionMetadataValue - /collections/{collectionId}/metadata/keys/{key}', function () {

        it('Set one metadata key/value of a Collection',async function () {
          const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/metadata/keys/${reference.testCollection.collectionMetadataKey}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            .set('Content-Type', 'application/json') 
            .send(`${JSON.stringify(reference.testCollection.collectionMetadataValue)}`)

          if(distinct.canModifyCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(204)
        })
      })
    })
  }

})


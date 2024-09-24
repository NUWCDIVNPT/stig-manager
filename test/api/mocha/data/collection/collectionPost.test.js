const chai = require("chai")
const chaiHttp = require("chai-http")
chai.use(chaiHttp)
const expect = chai.expect
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(deepEqualInAnyOrder)
const config = require("../../testConfig.json")
const utils = require("../../utils/testUtils")
const iterations = require("../../iterations.js")
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies.js')

describe('POST - Collection - not all tests run for all iterations', function () {

  before(async function () {
    // this.timeout(4000)
    await utils.uploadTestStigs()
    try{
      await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
    }
    catch(err){
        console.log("no stig to upload")
    }
    await utils.loadAppData()
    await utils.createDisabledCollectionsandAssets()
  })

  after(async function () {
    await utils.deleteStigByRevision("VPN_SRG_TEST", "V1R0")
  })

  for(const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`,async function () {})
      continue
    }
    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
      
      // before(async function () {
      //   // this.timeout(4000)
      //   await utils.uploadTestStigs()
      //   try{
      //     await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
      //   }
      //   catch(err){
      //       console.log("no stig to upload")
      //   }
      //   await utils.loadAppData()
      //   await utils.createDisabledCollectionsandAssets()
      // })

      // after(async function () {
      //   await utils.deleteStigByRevision("VPN_SRG_TEST", "V1R0")
      // })
  
      describe("createCollection - /collections", function () {

        const random = Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100)

        it("Create a Collection and test projections",async function () {
          const post = JSON.parse(JSON.stringify(requestBodies.createCollection))
          post.name = "testCollection" + random
          const res = await chai
          .request(config.baseUrl)
          .post(
            `/collections?elevate=${distinct.canElevate}&projection=grants&projection=labels&projection=assets&projection=owners&projection=statistics&projection=stigs`
          )
          .set("Authorization", `Bearer ${iteration.token}`)
          .send(post)
          if(distinct.canCreateCollection === false){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(201)
          if (distinct.grant === 'none') {  
            // grant = none iteration can create a collection, but does not give itself access to the collection
            // TODO: Should eventually be changed to respond with empty object
            return
          }
          expect(res.body.description).to.equal("Collection TEST description")
          expect(res.body.name).to.equal(post.name)
          expect(res.body.settings.fields.detail.enabled).to.equal(post.settings.fields.detail.enabled)
          expect(res.body.settings.fields.detail.required).to.equal(post.settings.fields.detail.required)
          expect(res.body.settings.fields.comment.enabled).to.equal(post.settings.fields.comment.enabled)
          expect(res.body.settings.fields.comment.required).to.equal(post.settings.fields.comment.required)
          expect(res.body.settings.status.canAccept).to.equal(post.settings.status.canAccept)
          expect(res.body.settings.status.minAcceptGrant).to.equal(post.settings.status.minAcceptGrant)
          expect(res.body.settings.status.resetCriteria).to.equal(post.settings.status.resetCriteria)
          expect(res.body.settings.history.maxReviews).to.equal(post.settings.history.maxReviews)
          expect(res.body.metadata.pocName).to.equal(post.metadata.pocName)
          expect(res.body.metadata.pocEmail).to.equal(post.metadata.pocEmail)
          expect(res.body.metadata.pocPhone).to.equal(post.metadata.pocPhone)
          expect(res.body.metadata.reqRar).to.equal(post.metadata.reqRar)

          // grants projection
          expect(res.body.grants).to.have.lengthOf(1)
          expect(res.body.grants[0].user.userId).to.equal("1")
          expect(res.body.grants[0].accessLevel).to.equal(4)

          // labels projection
          expect(res.body.labels).to.have.lengthOf(1)
          expect(res.body.labels[0].name).to.equal("TEST")
          expect(res.body.labels[0].description).to.equal("Collection label description")
          expect(res.body.labels[0].color).to.equal("ffffff")

          // assets projection
          expect(res.body.assets).to.have.lengthOf(0)

          // owners projection
          expect(res.body.owners).to.have.lengthOf(1)
          expect(res.body.owners[0].userId).to.equal("1")

          // statistics projection
          expect(res.body.statistics.assetCount).to.equal(0)
          expect(res.body.statistics.checklistCount).to.equal(0)
          expect(res.body.statistics.grantCount).to.equal(1)
      
          // stigs projection
          expect(res.body.stigs).to.have.lengthOf(0)

          // just an extra check to make sure the collection was created
          const createdCollection = await utils.getCollection(res.body.collectionId)
            expect(createdCollection).to.exist
        })
        it("should throw SmError.UnprocessableError due to duplicate user in grant array.",async function () {

          const post = JSON.parse(JSON.stringify(requestBodies.createCollection))
          post.grants.push(post.grants[0])
          post.name = "TEST" + Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100)
          const res = await chai
            .request(config.baseUrl)
            .post(`/collections?elevate=${distinct.canElevate}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send(post)
            if(distinct.canCreateCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(422)
            expect(res.body.error).to.equal("Unprocessable Entity.")
            expect(res.body.detail).to.equal("Duplicate user in grant array")
        })
        it("should throw SmError.UnprocessableError due to duplicate name exists ",async function () {
          const post = JSON.parse(JSON.stringify(requestBodies.createCollection))
          post.name = "testCollection" + random
          const res = await chai
           .request(config.baseUrl)
           .post(`/collections?elevate=${distinct.canElevate}&projection=grants&projection=labels&projection=assets&projection=owners&projection=statistics&projection=stigs`)
           .set("Authorization", `Bearer ${iteration.token}`)
           .send(post)
          if(distinct.canCreateCollection === false){
            expect(res).to.have.status(403)
            return
          }
          if (distinct.grant === 'none') {  
            // grant = none iteration can create a collection, but does not give itself access to the collection
            // TODO: Should eventually be changed to respond with empty object
            return
          }
          expect(res).to.have.status(422)
          expect(res.body.error).to.equal("Unprocessable Entity.")
          expect(res.body.detail).to.equal("Duplicate name exists.")
        })
      })

      describe("cloneCollection - /collections/{collectionId}/clone - test basic clone permissions (ie. must have owner grant + createCollection priv", function () {

        // this is flakey should be redesigned.
        before(async function () {
          // this.timeout(4000)
          await utils.setDefaultRevision(reference.testCollection.collectionId, reference.benchmark, reference.testCollection.pinRevision)
        })
        it("Clone test collection and check that cloned collection matches source ",async function () {

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/clone?projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs&projection=labels`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send({
              name:"Clone_" + Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100) + "_X",
              description: "clone of test collection x",
              options: {
                grants: true,
                labels: true,
                assets: true,
                stigMappings: "withReviews",
                pinRevisions: "matchSource",
              },
            })
            let clonedCollectionId = null
            if(!(distinct.canCreateCollection && distinct.canModifyCollection)){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            const response = res.body.toString().split("\n")
            expect(response).to.be.an('array')
            for(const message of response){ 
                if(message.length > 0){
                    let messageObj = JSON.parse(message)
                    if(messageObj.stage == "result"){
                        clonedCollectionId = messageObj.collection.collectionId
                        // assets 
                        expect(messageObj.collection.assets).to.have.lengthOf(reference.testCollection.assetsProjected.length)

                        for(const asset of messageObj.collection.assets){
                          expect(asset.name).to.be.oneOf(reference.testCollection.assetsProjected.map(a => a.name))
                        }
                        // grants
                        expect(messageObj.collection.grants).to.have.same.deep.members(reference.testCollection.grantsProjected)

                        // owners
                        expect(messageObj.collection.owners).to.have.same.deep.members(reference.testCollection.ownersProjected)
                        // statistics
                        expect(messageObj.collection.statistics.assetCount).to.eql(reference.testCollection.statisticsProjected.assetCount);
                        expect(messageObj.collection.statistics.grantCount).to.eql(reference.testCollection.statisticsProjected.grantCount);
                        expect(messageObj.collection.statistics.checklistCount).to.eql(reference.testCollection.statisticsProjected.checklistCount);
                        // // stigs 
                        expect(messageObj.collection.stigs).to.deep.equalInAnyOrder(reference.testCollection.stigsProjected)
                        // labels
                        expect(messageObj.collection.labels).to.have.lengthOf(reference.testCollection.labelsProjected.length)
                        for(const label of messageObj.collection.labels){
                            expect(label.name).to.be.oneOf(reference.testCollection.labelsProjected.map(l => l.name))
                        }
                    }
                }
            }
            
            if(clonedCollectionId !== null){
            // check reviews are there.
            const clonedCollectionReviews = await utils.getReviews(clonedCollectionId)
            const sourceCollectionReviews = await utils.getReviews(reference.testCollection.collectionId)
            expect(clonedCollectionReviews).to.exist
            expect(sourceCollectionReviews).to.exist
            expect(clonedCollectionReviews).to.be.an('array').of.length(sourceCollectionReviews.length)
            const reviewRegex = "test"
            const assetRegex = "asset"

            for(const review of clonedCollectionReviews){
                expect(review.detail).to.match(new RegExp(reviewRegex))
                expect(review.assetName).to.match(new RegExp(assetRegex))
            }

            // compare the cloned collection with the source collection should be the same
            const clonedCollection = await utils.getCollection(clonedCollectionId)
            const sourceCollection = await utils.getCollection(reference.testCollection.collectionId)
            expect(sourceCollection).to.exist
            expect(clonedCollection).to.exist 

            for(const asset of clonedCollection.assets){
                expect(asset.name).to.be.oneOf(sourceCollection.assets.map(a => a.name))
            }
            expect(clonedCollection.assets).to.have.lengthOf(sourceCollection.assets.length)
            expect(clonedCollection.grants).to.have.lengthOf(sourceCollection.grants.length)
            expect(clonedCollection.labels).to.have.lengthOf(sourceCollection.labels.length)
            expect(clonedCollection.owners).to.have.lengthOf(sourceCollection.owners.length)
          }
        })
      })

      describe("exportToCollection - /collections/{collectionId}/export-to/{dstCollectionId}", function () {

        before(async function () {
          // this.timeout(4000)
          // await utils.uploadTestStigs()
          await utils.loadAppData()
        })
        
        it("export entire asset to another collection, should create asset in destination",async function () {

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/export-to/${reference.scrapCollection.collectionId}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send([
              {
                assetId: reference.testAsset.assetId,
              },
            ])
            
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            const response = res.body.toString().split("\n")
            expect(response).to.be.an('array')
            expect(response).to.have.lengthOf.at.least(1)

            for(const message of response){ 
                if(message.length > 0){
                    let messageObj = JSON.parse(message)
                    if(messageObj.stage == "result"){
                      expect(messageObj.counts.assetsCreated).to.eql(1)
                      expect(messageObj.counts.stigsMapped).to.eql(reference.testAsset.validStigs.length)
                      expect(messageObj.counts.reviewsInserted).to.eql(reference.testAsset.reviewCnt)
                      expect(messageObj.counts.reviewsUpdated).to.eql(0)
                    }
                }
            }
        })

        it("export entire asset to another collection, asset already exists so we will be updating reviews",async function () {

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/export-to/${reference.scrapCollection.collectionId}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send([
              {
                assetId: reference.testAsset.assetId,
              },
            ])

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }

            expect(res).to.have.status(200)
            const response = res.body.toString().split("\n")
            expect(response).to.be.an('array')
            expect(response).to.have.lengthOf.at.least(1)
            for(const message of response){ 
                if(message.length > 0){
                    let messageObj = JSON.parse(message)
                    if(messageObj.stage == "result"){
                      expect(messageObj.counts.assetsCreated).to.eql(0)
                      expect(messageObj.counts.stigsMapped).to.eql(0)
                      expect(messageObj.counts.reviewsInserted).to.eql(0)
                      expect(messageObj.counts.reviewsUpdated).to.eql(9)
                    }
                }
            }
        })
      })

      describe("createCollectionLabel - /collections/{collectionId}/labels", function () {

        let label = null

        it("Create Label in a Collection",async function () {

          const request = {
              "name": "test-label-POST",
              "description": "test label POSTED",
              "color": "aa34cc"
            }
          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.scrapCollection.collectionId}/labels`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send(request)

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            label = res.body
            expect(res).to.have.status(201)
            expect(res.body.name).to.equal(request.name)
            expect(res.body.description).to.equal(request.description)
            expect(res.body.color).to.equal(request.color)
            expect(res.body.uses).to.equal(0)
        })
        it("Clean up - delete label",async function () {
            if(label){
              const res = await chai
                .request(config.baseUrl)
                .delete(`/collections/${reference.scrapCollection.collectionId}/labels/${label.labelId}`)
                .set("Authorization", `Bearer ${iteration.token}`)
                expect(res).to.have.status(204)
            }
        })
      })

      describe("writeStigPropsByCollectionStig - /collections/{collectionId}/stigs/{benchmarkId}", function () {
        before(async function () {
          this.timeout(4000)
          // await utils.uploadTestStigs()
          await utils.loadAppData()
        })

        it("Set revision v1r1 of test benchmark to assets",async function () {

          const post =
          {
            defaultRevisionStr: "V1R1",
            assetIds: ["62", "42", "154"],
          }

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send(post)

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }

            expect(res).to.have.status(200)
            expect(res.body.revisionStr).to.eql(requestBodies.writeStigPropsByCollectionStig.defaultRevisionStr)
            expect(res.body.revisionPinned).to.eql(true)
            expect(res.body.ruleCount).to.eql(reference.checklistLength)
            expect(res.body.benchmarkId).to.eql(reference.testCollection.benchmark)
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("Set latest revision of the test benchmark to assets",async function () {

          const post = {
            defaultRevisionStr: "latest",
            assetIds: requestBodies.writeStigPropsByCollectionStig.assetIds,
          }

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send(post)

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }

            expect(res).to.have.status(200)
            expect(res.body.revisionStr).to.equal(requestBodies.writeStigPropsByCollectionStig.defaultRevisionStr)
            expect(res.body.revisionPinned).to.equal(false)
            expect(res.body.ruleCount).to.eql(reference.checklistLength)
            expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("map list of assets to test benchmark",async function () {

          const post = {
            assetIds: requestBodies.writeStigPropsByCollectionStig.assetIds,
          }

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send(post)

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }

            expect(res).to.have.status(200)
            expect(res.body.revisionStr).to.equal(requestBodies.writeStigPropsByCollectionStig.defaultRevisionStr)
            expect(res.body.revisionPinned).to.equal(false)
            expect(res.body.ruleCount).to.eql(reference.checklistLength)
            expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("attempt to send invalid revision str, should cause error",async function () {

          const post = {
          defaultRevisionStr: "V1R5"
          }

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send(post)

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }

            expect(res).to.have.status(422)
        })

        it("Set the default revision string of test benchmark (V1R0)",async function () {

          const post = {
          defaultRevisionStr: reference.testCollection.pinRevision
          }

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
            .set("Authorization", `Bearer ${iteration.token}`)
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
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("Set the Assets mapped to a STIG - clear assets",async function () {

          const post = {
          assetIds: []
          }

          const res = await chai
            .request(config.baseUrl)
            .post(`/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`)
            .set("Authorization", `Bearer ${iteration.token}`)
            .send(post)

            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }

            expect(res).to.have.status(204)
            expect(res.body).to.eql({})
            
        })
      })
    })
  }
})



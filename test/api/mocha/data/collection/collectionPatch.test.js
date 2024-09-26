const chai = require('chai')
const chaiHttp = require('chai-http')
const { v4: uuidv4 } = require('uuid')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies.js')

describe('PATCH - Collection', function () {

    before(async function () {
        this.timeout(4000)
        await utils.loadAppData()
        await utils.uploadTestStigs()
    })

    for(const iteration of iterations) {
      const distinct = expectations[iteration.name]
      if (expectations[iteration.name] === undefined){
        it(`No expectations for this iteration scenario: ${iteration.name}`,async function () {})
        return
      }

      describe(`iteration:${iteration.name}`, function () {

        beforeEach(async function () {
          await utils.putCollection(reference.testCollection.collectionId, requestBodies.resetTestCollection)
        })
        describe('updateCollection - /collections/{collectionId}', function () {

          it('Patch test collection, send 5 new grants and metadata.',async function () {

            const patchRequest = requestBodies.updateCollection            
            const res = await chai.request(config.baseUrl)
                  .patch(`/collections/${reference.testCollection.collectionId}?&projection=grants&projection=stigs`)
                  .set('Authorization', `Bearer ${iteration.token}`)
                  .send(patchRequest)
            
                if(distinct.canModifyCollection === false){
                    expect(res).to.have.status(403)
                    return
                }
            expect(res).to.have.status(200)

            expect(res.body.metadata.pocName).to.equal(patchRequest.metadata.pocName)
            expect(res.body.metadata.pocEmail).to.equal(patchRequest.metadata.pocEmail)
            expect(res.body.metadata.pocPhone).to.equal(patchRequest.metadata.pocPhone)
            expect(res.body.metadata.reqRar).to.equal(patchRequest.metadata.reqRar)

            expect(res.body.grants).to.have.lengthOf(patchRequest.grants.length)
            for(let stig of res.body.stigs) {
                expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
                if(stig.benchmarkId === reference.benchmark){
                    expect(stig.ruleCount).to.equal(reference.checklistLength)
                }
            }
          })
          it("should throw SmError.UnprocessableError when updating due to duplicate user in grant array.",async function () {

            const patchRequest = JSON.parse(JSON.stringify(requestBodies.updateCollection))
            patchRequest.grants.push(patchRequest.grants[0])
            patchRequest.name = "TEST" + Math.floor(Math.random() * 100) + "-" + Math.floor(Math.random() * 100)
            const res = await chai.request(config.baseUrl)
                .patch(`/collections/${reference.testCollection.collectionId}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(patchRequest)
              if(distinct.canModifyCollection === false){
                  expect(res).to.have.status(403)
                  return
              }
              expect(res).to.have.status(422)
              expect(res.body.error).to.equal("Unprocessable Entity.")
              expect(res.body.detail).to.equal("Duplicate user in grant array")
          })
        })
        describe('patchCollectionLabelById - /collections/{collectionId}/labels/{labelId}', function () {

          it('Patch test collection label, change color, description and name ',async function () {
            // this needed to be done because we are putting the collection in beforeeach which alters the labelId
            const labelGet = await chai.request(config.baseUrl)  
              .get(`/collections/${reference.testCollection.collectionId}/labels`)
              .set('Authorization', `Bearer ${iteration.token}`)
            if(distinct.canModifyCollection === false){
              return
            }
            const fullLabel = labelGet.body.find(label => label.name === "test-label-full")
            
            const body = requestBodies.patchCollectionLabelById
            const res = await chai.request(config.baseUrl)
                .patch(`/collections/${reference.testCollection.collectionId}/labels/${fullLabel.labelId}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(body)
                
              if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(200)
  
              expect(res.body.labelId).to.equal(fullLabel.labelId)
              expect(res.body.description).to.equal(body.description)
              expect(res.body.color).to.equal(body.color)
              expect(res.body.name).to.equal(body.name)
          })
          it("should throw SmError.NotFoundError when updating a label that doesn't exist.",async function () {

            const body = requestBodies.patchCollectionLabelById
            const res = await chai.request(config.baseUrl)
                .patch(`/collections/${reference.testCollection.collectionId}/labels/${uuidv4()}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                .send(body)
              if(distinct.canModifyCollection === false){
                  expect(res).to.have.status(403)
                  return
              }
              expect(res).to.have.status(404)
              expect(res.body.error).to.equal("Resource not found.")
          })
        })
        describe('patchCollectionMetadata - /collections/{collectionId}/metadata', function () {

          it('Patch test collection metadata',async function () {
              
              const res = await chai.request(config.baseUrl)
                  .patch(`/collections/${reference.testCollection.collectionId}/metadata`)
                  .set('Authorization', `Bearer ${iteration.token}`)
                  .send({[reference.testCollection.collectionMetadataKey]: reference.testCollection.collectionMetadataValue})

                if(distinct.canModifyCollection === false){
                  expect(res).to.have.status(403)
                  return
                }

                expect(res).to.have.status(200)
                expect(res.body).to.contain({[reference.testCollection.collectionMetadataKey]: reference.testCollection.collectionMetadataValue})
          })
        })
      })
    }
})

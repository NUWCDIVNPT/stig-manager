
import { v4 as uuidv4 } from 'uuid'
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { expect } from 'chai'


describe('PATCH - Collection', function () {

    before(async function () {
        await utils.loadAppData()
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
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}?&projection=grants&projection=stigs`, 'PATCH', iteration.token, patchRequest)
            
            if(distinct.canModifyCollection === false){
                expect(res.status).to.eql(403)
                return
            }
            expect(res.status).to.eql(200)
            expect(res.body.metadata.pocName).to.equal(patchRequest.metadata.pocName)
            expect(res.body.metadata.pocEmail).to.equal(patchRequest.metadata.pocEmail)
            expect(res.body.metadata.pocPhone).to.equal(patchRequest.metadata.pocPhone)
            expect(res.body.metadata.reqRar).to.equal(patchRequest.metadata.reqRar)

            expect(res.body.grants).to.have.lengthOf(patchRequest.grants.length)
            for(let grant of res.body.grants) {
                if(grant.userId){
                    expect(grant.userId).to.be.oneOf(patchRequest.grants.map(grant => grant.userId))
                }
                if(grant.userGroupId){
                    expect(grant.userGroupId).to.be.oneOf(patchRequest.grants.map(grant => grant.userGroupId))
                }
            }
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
            patchRequest.name = "TEST" + utils.getUUIDSubString()
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}`, 'PATCH', iteration.token, patchRequest)
              if(distinct.canModifyCollection === false){
                  expect(res.status).to.eql(403)
                  return
              }
              expect(res.status).to.eql(422)
              expect(res.body.error).to.equal("Unprocessable Entity.")
              expect(res.body.detail).to.equal("Duplicate user in grant array")
          })

          it("should throw error because grants array has a repeated userGroupId",async function () {

            const patchRequest = JSON.parse(JSON.stringify(requestBodies.updateCollection))
           // patchRequest.grants.push(patchRequest.grants[0])
            patchRequest.grants.push({userGroupId: reference.testCollection.testGroup.userGroupId, roleId: 1})
            patchRequest.name = "TEST" + utils.getUUIDSubString()
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}`, 'PATCH', iteration.token, patchRequest)
              if(distinct.canModifyCollection === false){
                  expect(res.status).to.eql(403)
                  return
              }
              expect(res.status).to.eql(422)
              expect(res.body.error).to.equal("Unprocessable Entity.")
              expect(res.body.detail).to.equal("Duplicate user in grant array")

          })
        })
        describe('patchCollectionLabelById - /collections/{collectionId}/labels/{labelId}', function () {

          it('Patch test collection label, change color, description and name ',async function () {
            // this needed to be done because we are putting the collection in beforeeach which alters the labelId
            const labelGet = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels`, 'GET', iteration.token)
            if(distinct.canModifyCollection === false){
              return
            }
            const fullLabel = labelGet.body.find(label => label.name === "test-label-full")
            
            const body = requestBodies.patchCollectionLabelById
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${fullLabel.labelId}`, 'PATCH', iteration.token, body)
                
              if(distinct.canModifyCollection === false){
                expect(res.status).to.eql(403)
                return
              }
              expect(res.status).to.eql(200)
  
              expect(res.body.labelId).to.equal(fullLabel.labelId)
              expect(res.body.description).to.equal(body.description)
              expect(res.body.color).to.equal(body.color)
              expect(res.body.name).to.equal(body.name)
          })
          it("should throw SmError.NotFoundError when updating a label that doesn't exist.",async function () {

            const body = requestBodies.patchCollectionLabelById
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${uuidv4()}`, 'PATCH', iteration.token, body)
              if(distinct.canModifyCollection === false){
                  expect(res.status).to.eql(403)
                  return
              }
              expect(res.status).to.eql(404)
              expect(res.body.error).to.equal("Resource not found.")
          })
        })
        describe('patchCollectionMetadata - /collections/{collectionId}/metadata', function () {

          it('Patch test collection metadata',async function () {
              
              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metadata`, 'PATCH', iteration.token, {[reference.testCollection.collectionMetadataKey]: reference.testCollection.collectionMetadataValue})

                if(distinct.canModifyCollection === false){
                  expect(res.status).to.eql(403)
                  return
                }

                expect(res.status).to.eql(200)
                expect(res.body).to.contain({[reference.testCollection.collectionMetadataKey]: reference.testCollection.collectionMetadataValue})
          })
        })
      })
    }
})

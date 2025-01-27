
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { expect } from 'chai'


describe('POST - Asset', function () {
  for (const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }
    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
      describe(`createAsset - /assets`, function () {
        it('Create an Asset (with statusStats and stigs projection', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets?projection=statusStats&projection=stigs`, 'POST', iteration.token, {
              name: 'TestAsset' + utils.getUUIDSubString(10),
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelIds: [reference.testCollection.fullLabel],
              metadata: {
                pocName: 'pocName',
                pocEmail: 'pocEmail@example.com',
                pocPhone: '12345',
                reqRar: 'true'
              },
              stigs: reference.testCollection.validStigs
            })
          
            if(!distinct.canModifyCollection){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(201)
            
            expect(res.body.collection.collectionId).to.equal(reference.testCollection.collectionId)
            expect(res.body.name).to.be.a('string')
            expect(res.body.ip).to.equal('1.1.1.1')
            expect(res.body.noncomputing).to.equal(true)
            expect(res.body.labelIds).to.eql([reference.testCollection.fullLabel])
            expect(res.body.metadata.pocName).to.equal('pocName')
            expect(res.body.metadata.pocEmail).to.equal('pocEmail@example.com')
            expect(res.body.stigs).to.be.an('array').of.length(reference.testCollection.validStigs.length)
            expect(res.body).to.have.property('statusStats')
            expect(res.body.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)
            expect(res.body.statusStats.stigCount).to.equal(reference.testAsset.stats.stigCount)
            expect(res.body.statusStats.savedCount).to.equal(0)
            expect(res.body.statusStats.acceptedCount).to.equal(0)
            expect(res.body.statusStats.rejectedCount).to.equal(0)

            for(const stig of res.body.stigs) {
              expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
            }

            const effectedAsset = await utils.getAsset(res.body.assetId)

            expect(effectedAsset.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)

        })
        it('should fail, duplicate asset name', async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
              name: reference.testAsset.name,
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelIds: [reference.testCollection.fullLabel],
              metadata: {
                pocName: 'pocName',
              },
              stigs: reference.testCollection.validStigs
          })
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
        })
        it('Create an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
              name: 'TestAsset' + utils.getUUIDSubString(10),
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelIds: [reference.testCollection.fullLabel],
              metadata: {
                pocName: 'pocName',
                pocEmail: 'pocEmail@example.com',
                pocPhone: '12345',
                reqRar: 'true'
              },
              stigs: reference.testCollection.validStigs
            })
          
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)         
        })
      })
    })
  }
})

function assetGetToPost (assetGet) {
  // extract the transformed and unposted properties
  const { assetId, collection, stigs, mac, fqdn, ...assetPost } = assetGet

  // add transformed properties to the derived post
  assetPost.collectionId = collection.collectionId
  assetPost.stigs = stigsGetToPost(stigs)

  // the derived post object
  return assetPost
}

function stigsGetToPost (stigsGetArray) {
  const stigsPostArray = []
  for (const stig of stigsGetArray) {
    stigsPostArray.push(stig.benchmarkId)
  }
  return stigsPostArray
}

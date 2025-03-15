
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import {expect} from 'chai'

const createTempAsset = async () => {
  const res = await utils.createTempAsset(requestBodies.tempAssetPost)
  return res.data
}

describe('DELETE - Asset', function () {

  before(async function () {
    await utils.loadAppData()
  })

  beforeEach(async function () {
    await utils.resetTestAsset()
  })
  
  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
      describe(`deleteAssetMetadataKey - /assets/{assetId}/metadata/keys/{key}`, function () {
        it('Delete one metadata key/value of an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/metadata/keys/${reference.testAsset.metadataKey}`, 'DELETE', iteration.token)

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(204)
          
          const asset = await utils.getAsset(reference.testAsset.assetId)
          expect(asset.metadata).to.not.have.property(reference.testAsset.metadataKey)
        })
      })
      describe(`removeStigFromAsset - /assets/{assetId}/stigs/{benchmarkId}`, function () {
        it('Delete a STIG assignment to an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/stigs/${reference.benchmark}`, 'DELETE', iteration.token)
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)

          const asset = await utils.getAsset(reference.testAsset.assetId)
          expect(asset.stigs).to.not.include(reference.benchmark)
        })
      })
      describe(`removeStigsFromAsset -/assets/{assetId}/stigs`, function () {
        it('Delete all STIG assignments to an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/stigs`, 'DELETE', iteration.token)
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          const asset = await utils.getAsset(reference.testAsset.assetId)
          expect(asset.stigs).to.be.an('array').that.is.empty
        })
      })
      describe(`deleteAsset - /assets/{assetId}`, function () {

        let localTestAsset = null
        
        it('Create an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
            name: 'TestAsset' + utils.getUUIDSubString(10),
            collectionId: reference.testCollection.collectionId,
            description: 'test',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName],
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
          localTestAsset = res.body    
        })
       
        it('Delete scrap Asset', async function () {
          if(!distinct.canModifyCollection){
            return
          }
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${localTestAsset.assetId}?projection=statusStats&projection=stigs`, 'DELETE', iteration.token)
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.assetId).to.equal(localTestAsset.assetId)
          expect(res.body.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)

          expect(res.body.stigs).to.be.an('array').of.length(reference.testAsset.validStigs.length)
          for(const stig of res.body.stigs){
            expect(stig.benchmarkId).to.be.oneOf(reference.testAsset.validStigs)
          }

        })
      })
    })
  }
})



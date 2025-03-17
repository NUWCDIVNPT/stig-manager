
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { v4 as uuidv4 } from 'uuid'
import { expect } from 'chai'

describe('PUT - Asset', function () {

  before(async function () {
     await utils.resetTestAsset()
     await utils.resetScrapAsset()
  })

  for (const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }
    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]

      describe(`replaceAsset -/assets/{assetId}`, function () {
        
        it('Set all properties of an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}?projection=statusStats&projection=stigs`, 'PUT', iteration.token, {
              "name": 'TestAsset' + utils.getUUIDSubString(),
              "collectionId": reference.scrapCollection.collectionId,
              "description": "test desc",
              "ip": "1.1.1.1",
              "noncomputing": true,
              "labelNames": [
                  "scrapLabel"
              ],
              "metadata": {
                  "pocName": "poc2Put",
                  "pocEmail": "pocEmailPut@email.com",
                  "pocPhone": "12342",
                  "reqRar": "true"
              },
              "stigs": [
                  "VPN_SRG_TEST",
                  "Windows_10_STIG_TEST",
                  "RHEL_7_STIG_TEST"
              ]
          })

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)

          expect(res.body.collection.collectionId, "expect asset to be in scrap colleciton").to.equal(reference.scrapCollection.collectionId)
          expect(res.body.name).to.be.a('string')
          expect(res.body.ip).to.equal('1.1.1.1')
          expect(res.body.noncomputing).to.equal(true)
          expect(res.body.labelIds, "Expect asset to have scrap label").to.eql([reference.scrapCollection.scrapLabel])
          expect(res.body.metadata.pocName).to.equal('poc2Put')
          expect(res.body.metadata.pocEmail).to.equal('pocEmailPut@email.com')
          expect(res.body.stigs, "Expect asset to have 3 stigs").to.be.an('array').of.length(3)
          expect(res.body).to.have.property('statusStats')
          expect(res.body.statusStats.stigCount, "Expect asset to have 3 stigs").to.equal(3)
          expect(res.body.statusStats.savedCount).to.equal(0)
          expect(res.body.statusStats.acceptedCount).to.equal(0)
          expect(res.body.statusStats.rejectedCount).to.equal(0)
          
          
          for (let stig of res.body.stigs) {
            expect(stig.benchmarkId).to.be.oneOf([
              "VPN_SRG_TEST",
              "Windows_10_STIG_TEST",
              "RHEL_7_STIG_TEST"
          ])
          }
          const effectedAsset = await utils.getAsset(res.body.assetId)
          expect(effectedAsset.collection.collectionId).to.equal(reference.scrapCollection.collectionId)
          expect(effectedAsset.description).to.equal('test desc')
          expect(effectedAsset.labelIds).to.have.lengthOf(1)
          expect(effectedAsset.stigs).to.be.an('array').of.length(3)
          for (const stig of effectedAsset.stigs) {
            expect(stig.benchmarkId).to.be.oneOf([
              'VPN_SRG_TEST',
              'Windows_10_STIG_TEST',
              'RHEL_7_STIG_TEST'
            ])
          }

        })

        it('Set all properties of an Asset - assign new STIG', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs`, 'PUT', iteration.token, {
              "name": 'TestAsset' + utils.getUUIDSubString(),
              "collectionId": reference.testCollection.collectionId,
              "description": "test desc",
              "ip": "1.1.1.1",
              "noncomputing": true,
              "metadata": {
                  "pocName": "poc2Put",
                  "pocEmail": "pocEmailPut@email.com",
                  "pocPhone": "12342",
                  "reqRar": "true"
              },
              "stigs": [
                  "VPN_SRG_TEST",
                  "VPN_SRG_OTHER",
                  "Windows_10_STIG_TEST",
                  "RHEL_7_STIG_TEST"
              ]
            })
            if(!distinct.canModifyCollection){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)

            expect(res.body.statusStats.stigCount).to.equal(4)
            expect(res.body.stigs).to.be.an('array').of.length(4)
            for (const stig of res.body.stigs) {
              expect(stig.benchmarkId).to.be.oneOf([ "VPN_SRG_TEST",
                "VPN_SRG_OTHER",
                "Windows_10_STIG_TEST",
                "RHEL_7_STIG_TEST"
            ])
          }
          
          const effectedAsset = await utils.getAsset(res.body.assetId)
          expect(effectedAsset.collection.collectionId).to.equal(reference.testCollection.collectionId)
          expect(effectedAsset.stigs).to.be.an('array').of.length(4)
          for (const stig of effectedAsset.stigs) {
            expect(stig.benchmarkId).to.be.oneOf([ "VPN_SRG_TEST",
              "VPN_SRG_OTHER",
              "Windows_10_STIG_TEST",
              "RHEL_7_STIG_TEST"
            ])
          }
        })

        it('Set all properties of an Asset- with metadata', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}`, 'PUT', iteration.token, {
              "name":'TestAsset' + utils.getUUIDSubString(),
              "collectionId": reference.scrapCollection.collectionId,
              "description": "test desc",
              "ip": "1.1.1.1",
              "noncomputing": true,
              "metadata" : {
                [reference.scrapAsset.metadataKey]: reference.scrapAsset.metadataValue
              },
              "stigs": [
                  "VPN_SRG_TEST",
                  "Windows_10_STIG_TEST",
                  "RHEL_7_STIG_TEST"
              ]
          })

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          
          expect(res.body.metadata).to.exist
          expect(res.body.metadata).to.have.property(reference.scrapAsset.metadataKey)
          expect(res.body.metadata[reference.scrapAsset.metadataKey]).to.equal(reference.scrapAsset.metadataValue)

          const effectedAsset = await utils.getAsset(res.body.assetId)
          expect(effectedAsset.metadata).to.exist
          expect(effectedAsset.metadata).to.have.property(reference.scrapAsset.metadataKey)
          expect(effectedAsset.metadata[reference.scrapAsset.metadataKey]).to.equal(reference.scrapAsset.metadataValue)

        })

        it('Set all properties of an Asset - Change Collection - invalid for all iteration', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}`, 'PUT', iteration.token, {
              "name": 'TestAsset' + utils.getUUIDSubString(),
              "collectionId": reference.scrapLvl1User.userId,
              "description": "test desc",
              "ip": "1.1.1.1",
              "noncomputing": true,
              "metadata": {},
              "stigs": [
                  "VPN_SRG_TEST",
                  "Windows_10_STIG_TEST",
                  "RHEL_7_STIG_TEST"
              ]
            })
          expect(res.status).to.eql(403)
        })
      })
      describe(`putAssetMetadata - /assets/{assetId}/metadata`, function () {

        it('Set metadata of an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}/metadata`, 'PUT', iteration.token, {
              [reference.scrapAsset.metadataKey]: reference.scrapAsset.metadataValue
            })
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          
          expect(res.body).to.have.property(reference.scrapAsset.metadataKey)
          expect(res.body[reference.scrapAsset.metadataKey]).to.equal(reference.scrapAsset.metadataValue)

          const effectedAsset = await utils.getAsset(reference.scrapAsset.assetId)
          expect(effectedAsset.metadata).to.have.property(reference.scrapAsset.metadataKey)
        })
      })
      describe(`putAssetMetadataValue - /assets/{assetId}/metadata/keys/{key}`, function () {
      
        it('Set one metadata key/value of an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}/metadata/keys/${reference.scrapAsset.metadataKey}`, 'PUT', iteration.token, `${JSON.stringify(reference.scrapAsset.metadataValue)}`)

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          
          expect(res.status).to.eql(204)
          const effectedAsset = await utils.getAsset(reference.scrapAsset.assetId)
          expect(effectedAsset.metadata).to.have.property(reference.scrapAsset.metadataKey)
        })
      })
      describe(`attachStigToAsset - /assets/{assetId}/stigs/{benchmarkId}`, function () {
      
        it('PUT a STIG assignment to an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}/stigs/${reference.scrapAsset.scrapBenchmark}`, 'PUT', iteration.token)
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(3)
          for (let stig of res.body) {
            expect(stig.benchmarkId, "expect stig to be one of the valid stigs").to.be.oneOf(reference.scrapCollection.validStigs)
            if (stig.benchmarkId === reference.scrapAsset.scrapBenchmark) {
              expect(stig.benchmarkId).to.equal(reference.scrapAsset.scrapBenchmark)
            }
          }
          const effectedAsset = await utils.getAsset(reference.scrapAsset.assetId)
          expect(effectedAsset.stigs).to.be.an('array').of.length(3)
          for (let stig of effectedAsset.stigs) {
            if (stig.benchmarkId === reference.scrapAsset.scrapBenchmark) {
              expect(stig.benchmarkId).to.equal(reference.scrapAsset.scrapBenchmark)
            }
          }
        })
      })
      describe(`putAssetsByCollectionLabelId - /collections/{collectionId}/labels/{labelId}/assets`, function () {
      
        it('Replace a Labels Asset Mappings in a Collection', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${reference.testCollection.fullLabel}/assets`, 'PUT', iteration.token, [reference.testAsset.assetId])
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(1)
          expect(res.body[0].assetId).to.equal(reference.testAsset.assetId)

          const effectedAsset = await utils.getAssetsByLabel(reference.testCollection.collectionId, reference.testCollection.fullLabel)
          expect(effectedAsset).to.have.lengthOf(1)
          expect(effectedAsset[0].assetId).to.equal(reference.testAsset.assetId)
        })
        it('Replace a Labels Asset Mappings in a Collection assign to an asset that does not exist', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${reference.testCollection.fullLabel}/assets`, 'PUT', iteration.token, ["9999"])
          expect(res.status).to.eql(403)
        })
        it("should throw SmError.NotFoundError when updating a label that doesn't exist.",async function () {
          const labelId = uuidv4()
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${labelId}/assets`, 'PUT', iteration.token, [reference.testAsset.assetId])
            if(distinct.canModifyCollection === false){
                expect(res.status).to.eql(403)
                return
            }
            expect(res.status).to.eql(403)
            expect(res.body.error).to.equal("User has insufficient privilege to complete this request.")
            expect(res.body.detail).to.equal("The labelId is not associated with this Collection.")
        })
      })
      describe(`attachAssetsToStig - /collections/{collectionId}/stigs/{benchmarkId}/assets`, function () {
        it('Set the Assets mapped to a STIG', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/stigs/${reference.scrapAsset.scrapBenchmark}/assets`, 'PUT', iteration.token, [reference.scrapAsset.assetId])

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.an('array').of.length(1)
          expect(res.body[0].assetId).to.equal(reference.scrapAsset.assetId)
          expect(res.body[0].collectionId).to.equal(reference.scrapCollection.collectionId)
          if(iteration.name === 'lvl1'){
            expect(res.body[0].access).to.equal('r')
          }
          else
          {
            expect(res.body[0].access).to.equal('rw')
          }
        })
        it('should throw SM privilege error due to assetId not being apart of collection.', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/stigs/${reference.scrapAsset.scrapBenchmark}/assets`, 'PUT', iteration.token, [`1234321`])
          expect(res.status).to.eql(403)
        })
      })
    })
  }
})


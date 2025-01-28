
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)

describe('PATCH - Asset', function () {

  before(async () => {
    await utils.loadAppData()
  })
  
  after(async () => {
    await utils.resetTestAsset()
    await utils.resetScrapAsset()
  })

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
      let testAsset = null
      let scrapAsset = null
      beforeEach(async function () {

        testAsset = await utils.resetTestAsset()
        scrapAsset = await utils.resetScrapAsset()
      })

      describe(`updateAsset - /assets/{assetId}`, function () {

        it('Merge provided properties with an Asset - Change Collection - Fail for all iterations', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs`, 'PATCH', iteration.token, { 
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

        it('Merge provided properties with an Asset - Change Collection - valid for lvl3 and lvl4 only (IE works for admin for me)', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs`, 'PATCH', iteration.token, {
              "collectionId": reference.scrapCollection.collectionId,
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
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.collection.collectionId).to.equal(reference.scrapCollection.collectionId)
          expect(res.body.labelIds).to.have.lengthOf(reference.testAsset.labels.length)
          expect(res.body.ip).to.equal(reference.testAsset.ipaddress)
          expect(res.body.noncomputing).to.equal(true)
          expect(res.body.metadata).to.deep.equal({})
          expect(res.body.description).to.equal('test desc')
          for(const stig of res.body.stigs){
            expect(stig.benchmarkId).to.be.oneOf([
              'VPN_SRG_TEST',
              'Windows_10_STIG_TEST',
              'RHEL_7_STIG_TEST'
            ])
          }
          const effectedAsset = await utils.getAsset(res.body.assetId)
          expect(effectedAsset.collection.collectionId).to.equal(reference.scrapCollection.collectionId)
          expect(effectedAsset.description).to.equal('test desc')
          expect(effectedAsset.labelIds).to.have.lengthOf(2)
          for (const stig of effectedAsset.stigs) {
            expect(stig.benchmarkId).to.be.oneOf([
              'VPN_SRG_TEST',
              'Windows_10_STIG_TEST',
              'RHEL_7_STIG_TEST'
            ])
          }
          
        }) 
    
        it('Merge provided properties with an Asset', async function () {
        
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}?projection=statusStats&projection=stigs`, 'PATCH', iteration.token, {
              "collectionId": reference.scrapCollection.collectionId,
              "description": "scrap",
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
                  "Windows_10_STIG_TEST",
                  "RHEL_7_STIG_TEST"
              ]
          })
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          expect(res.body.collection.collectionId).to.equal(reference.scrapCollection.collectionId)
          expect(res.body.ip).to.equal("1.1.1.1")
          expect(res.body.noncomputing).to.equal(true)
          expect(res.body.metadata).to.deep.equal({
            "pocName": "poc2Put",
            "pocEmail": "pocEmailPut@email.com",
            "pocPhone": "12342",
            "reqRar": "true"
          })
          for(const stig of res.body.stigs){
            expect(stig.benchmarkId).to.be.oneOf([
              'VPN_SRG_TEST',
              'Windows_10_STIG_TEST',
              'RHEL_7_STIG_TEST'
            ])
          }
          const effectedAsset = await utils.getAsset(res.body.assetId)
          expect(effectedAsset.collection.collectionId).to.equal(reference.scrapCollection.collectionId)
          expect(effectedAsset.description).to.equal('scrap')
          expect(effectedAsset.metadata).to.deep.equal({
            "pocName": "poc2Put",
            "pocEmail": "pocEmailPut@email.com",
            "pocPhone": "12342",
            "reqRar": "true"
          })
          for(const stig of effectedAsset.stigs){
            expect(stig.benchmarkId).to.be.oneOf([
              'VPN_SRG_TEST',
              'Windows_10_STIG_TEST',
              'RHEL_7_STIG_TEST'
            ])
          }
        })

        it("asset id does not exist", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets/999999`, 'PATCH', iteration.token, {
              "description": "scrap",
          })
          expect(res.status).to.eql(403)
        })
      })

      describe(`patchAssetMetadata - /assets/{assetId}/metadata`, function () {
        
        it('Merge provided properties with an Asset - Change metadata', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/metadata`, 'PATCH', iteration.token, {
              "testkey":"poc2Patched"
            })

            if(!distinct.canModifyCollection){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.body, "expect new metadata to take effect").to.deep.equal({
              "testkey": "poc2Patched",
            })
            const effectedAsset = await utils.getAsset(reference.testAsset.assetId)
            expect(effectedAsset.metadata, "getting asset for double checking").to.deep.equal({
              "testkey": "poc2Patched"
            })
        })
        it('Merge metadata property/value into an Asset', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.scrapAsset.assetId}/metadata`, 'PATCH', iteration.token, {
              "testkey":"poc2Patched"
            })

            if(!distinct.canModifyCollection){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.body).to.deep.equal({
              "testkey": "poc2Patched",
            })
            const effectedAsset = await utils.getAsset(reference.scrapAsset.assetId)
            expect(effectedAsset.metadata, "getting asset for double check metadata has changed").to.deep.equal({
              "testkey": "poc2Patched"
            })
        })
      })
      
      describe(`patchAssets - /assets`, function () {

        let asset1 = null
        let asset2 = null

        before(async function () {
          asset1 = await utils.createTempAsset()
          asset2 = await utils.createTempAsset()
        
        })
    
        it('Delete Assets - expect success for valid iterations', async function () {

            const assetIds = [asset1.assetId, asset2.assetId]

            const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}`, 'PATCH', iteration.token, {
                "operation": "delete",
                "assetIds": assetIds
            })
        
            if(!distinct.canModifyCollection){
                expect(res.status).to.eql(403)
                return
            }
            expect(res.status).to.eql(200)
            expect(res.body, "expect assets 29 and 42 to be delted").to.eql({
            "operation": "deleted",
            "assetIds": assetIds})
            
            for(const assetID of res.body.assetIds){
                const effectedAsset = await utils.getAsset(assetID)
                expect(effectedAsset.status, "response should be 403 due to asset being deleted").to.equal(403)
            }
            
        })
        it('Delete Assets - assets not in collection', async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}`, 'PATCH', iteration.token, {
                "operation": "delete",
                "assetIds": ["258","260"]
              })
              expect(res.status).to.eql(403)
        })
        it('Delete Assets - collection does not exist', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${99999}`, 'PATCH', iteration.token, {
              "operation": "delete",
              "assetIds": ["29","42"]
            })
            expect(res.status).to.eql(403)
        })
      })  
    })
  }
})


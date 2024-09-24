const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')

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

        this.timeout(4000)
        testAsset = await utils.resetTestAsset()
        scrapAsset = await utils.resetScrapAsset()
      })

      describe(`updateAsset - /assets/{assetId}`, function () {

        it('Merge provided properties with an Asset - Change Collection - Fail for all iterations', async function () {
          const res = await chai
            .request(config.baseUrl)
            .patch(`/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs&projection=stigGrants`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({ 
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

          expect(res).to.have.status(403)
        })

        it('Merge provided properties with an Asset - Change Collection - valid for lvl3 and lvl4 only (IE works for admin for me)', async function () {
          const res = await chai
            .request(config.baseUrl)
            .patch(`/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs&projection=stigGrants`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
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
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
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
          for (const stigGrant of res.body.stigGrants) {
            expect(stigGrant.users).to.have.lengthOf(0);
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
        
          const res = await chai
            .request(config.baseUrl)
            .patch(`/assets/${reference.scrapAsset.assetId}?projection=statusStats&projection=stigs&projection=stigGrants`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
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
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
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
      })

      describe(`patchAssetMetadata - /assets/{assetId}/metadata`, function () {
        
        it('Merge provided properties with an Asset - Change metadata', async function () {
          const res = await chai
            .request(config.baseUrl)
            .patch(`/assets/${reference.testAsset.assetId}/metadata`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "testkey":"poc2Patched"
            })

            if(!distinct.canModifyCollection){
              expect(res, "unauthorized").to.have.status(403)
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
          const res = await chai
            .request(config.baseUrl)
            .patch(`/assets/${reference.scrapAsset.assetId}/metadata`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "testkey":"poc2Patched"
            })

            if(!distinct.canModifyCollection){
              expect(res, "un authorized").to.have.status(403)
              return
            }
            expect(res.body, "expect new metdata to be returned").to.deep.equal({
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

            const assetIds = [asset1.data.assetId, asset2.data.assetId]

            const res = await chai
            .request(config.baseUrl)
            .patch(`/assets?collectionId=${reference.testCollection.collectionId}`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
                "operation": "delete",
                "assetIds": assetIds
            })
        
            if(!distinct.canModifyCollection){
                expect(res).to.have.status(403)
                return
            }
            expect(res).to.have.status(200)
            expect(res.body, "expect assets 29 and 42 to be delted").to.eql({
            "operation": "deleted",
            "assetIds": assetIds})
            
            for(const assetID of res.body.assetIds){
                const effectedAsset = await utils.getAsset(assetID)
                expect(effectedAsset.status, "response should be 403 due to asset being deleted").to.equal(403)
            }
            
        })
        it('Delete Assets - assets not in collection', async function () {
            const res = await chai
              .request(config.baseUrl)
              .patch(`/assets?collectionId=${reference.testCollection.collectionId}`)
              .set('Authorization', 'Bearer ' + iteration.token)
              .send({
                "operation": "delete",
                "assetIds": ["258","260"]
              })
              expect(res, "assets are not in collection 21.").to.have.status(403)
        })
        it('Delete Assets - collection does not exist', async function () {
          const res = await chai
            .request(config.baseUrl)
            .patch(`/assets?collectionId=${99999}`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "operation": "delete",
              "assetIds": ["29","42"]
            })
            expect(res, "collecitonId is does not exist").to.have.status(403)
        })
      })  
    })
  }
})


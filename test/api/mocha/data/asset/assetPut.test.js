const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')
const { v4: uuidv4 } = require('uuid')

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
          const res = await chai.request(config.baseUrl)
            .put(`/assets/${reference.scrapAsset.assetId}?projection=statusStats&projection=stigs&projection=stigGrants`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "name": 'TestAsset' + Math.floor(Math.random() * 1000),
              "collectionId": reference.scrapCollection.collectionId,
              "description": "test desc",
              "ip": "1.1.1.1",
              "noncomputing": true,
              "labelIds": [
                  "df4e6836-a003-11ec-b1bc-0242ac110002"
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
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)

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
          expect(res.body.stigGrants).to.be.an('array').of.length(3)
          for (let stig of res.body.stigGrants) {
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
          const res = await chai.request(config.baseUrl)
            .put(`/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs&projection=stigGrants`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "name": 'TestAsset' + Math.floor(Math.random() * 1000),
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
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)

            expect(res.body.statusStats.stigCount).to.equal(4)
            expect(res.body.stigs).to.be.an('array').of.length(4)
            for (const stig of res.body.stigs) {
              expect(stig.benchmarkId).to.be.oneOf([ "VPN_SRG_TEST",
                "VPN_SRG_OTHER",
                "Windows_10_STIG_TEST",
                "RHEL_7_STIG_TEST"
            ])
          }
          
          expect(res.body.stigGrants).to.be.an('array').of.length(4)
            for(const stig of res.body.stigGrants) {
              expect(stig.benchmarkId).to.be.oneOf([ "VPN_SRG_TEST",
                "VPN_SRG_OTHER",
                "Windows_10_STIG_TEST",
                "RHEL_7_STIG_TEST"
              ])
              if(stig.benchmarkId === "VPN_SRG_TEST"){
                expect(stig.users[0].userId).to.equal(reference.lvl1User.userId)
              }
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
          const res = await chai.request(config.baseUrl)
            .put(`/assets/${reference.scrapAsset.assetId}`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "name":'TestAsset' + Math.floor(Math.random() * 1000),
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
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          
          expect(res.body.metadata).to.exist
          expect(res.body.metadata).to.have.property(reference.scrapAsset.metadataKey)
          expect(res.body.metadata[reference.scrapAsset.metadataKey]).to.equal(reference.scrapAsset.metadataValue)

          const effectedAsset = await utils.getAsset(res.body.assetId)
          expect(effectedAsset.metadata).to.exist
          expect(effectedAsset.metadata).to.have.property(reference.scrapAsset.metadataKey)
          expect(effectedAsset.metadata[reference.scrapAsset.metadataKey]).to.equal(reference.scrapAsset.metadataValue)

        })

        it('Set all properties of an Asset - Change Collection - invalid for all iteration', async function () {
          const res = await chai.request(config.baseUrl)
            .put(`/assets/${reference.scrapAsset.assetId}`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "name": 'TestAsset' + Math.floor(Math.random() * 1000),
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
      })
      describe(`putAssetMetadata - /assets/{assetId}/metadata`, function () {

        it('Set metadata of an Asset', async function () {
          const res = await chai.request(config.baseUrl)
            .put(`/assets/${reference.scrapAsset.assetId}/metadata`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              [reference.scrapAsset.metadataKey]: reference.scrapAsset.metadataValue
            })
          if(!distinct.canModifyCollection){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          
          expect(res.body).to.have.property(reference.scrapAsset.metadataKey)
          expect(res.body[reference.scrapAsset.metadataKey]).to.equal(reference.scrapAsset.metadataValue)

          const effectedAsset = await utils.getAsset(reference.scrapAsset.assetId)
          expect(effectedAsset.metadata).to.have.property(reference.scrapAsset.metadataKey)
        })
      })
      describe(`putAssetMetadataValue - /assets/{assetId}/metadata/keys/{key}`, function () {
      
        it('Set one metadata key/value of an Asset', async function () {
          const res = await chai.request(config.baseUrl)
            .put(`/assets/${reference.scrapAsset.assetId}/metadata/keys/${reference.scrapAsset.metadataKey}`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .set('Content-Type', 'application/json') 
            .send(`${JSON.stringify(reference.scrapAsset.metadataValue)}`)

          if(!distinct.canModifyCollection){
            expect(res).to.have.status(403)
            return
          }
          
          expect(res).to.have.status(204)
          const effectedAsset = await utils.getAsset(reference.scrapAsset.assetId)
          expect(effectedAsset.metadata).to.have.property(reference.scrapAsset.metadataKey)
        })
      })
      describe(`attachStigToAsset - /assets/{assetId}/stigs/{benchmarkId}`, function () {
      
        it('PUT a STIG assignment to an Asset', async function () {
          const res = await chai.request(config.baseUrl)
            .put(`/assets/${reference.scrapAsset.assetId}/stigs/${reference.scrapAsset.scrapBenchmark}`)
            .set('Authorization', 'Bearer ' + iteration.token)
          if(!distinct.canModifyCollection){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
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
          const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/labels/${reference.testCollection.fullLabel}/assets`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send([reference.testAsset.assetId])
          if(!distinct.canModifyCollection){
            expect(res).to.have.status(403)
            return
          }
         
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array').of.length(1)
          expect(res.body[0].assetId).to.equal(reference.testAsset.assetId)

          const effectedAsset = await utils.getAssetsByLabel(reference.testCollection.collectionId, reference.testCollection.fullLabel)
          expect(effectedAsset).to.have.lengthOf(1)
          expect(effectedAsset[0].assetId).to.equal(reference.testAsset.assetId)
        })
        it('Replace a Labels Asset Mappings in a Collection assign to an asset that does not exist', async function () {
          const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/labels/${reference.testCollection.fullLabel}/assets`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send(["9999"])
          expect(res).to.have.status(403)
        })
        it("should throw SmError.NotFoundError when updating a label that doesn't exist.",async function () {
          const labelId = uuidv4()
          const res = await chai.request(config.baseUrl)
              .put(`/collections/${reference.testCollection.collectionId}/labels/${labelId}/assets`)
              .set('Authorization', `Bearer ${iteration.token}`)
              .send([reference.testAsset.assetId])
            if(distinct.canModifyCollection === false){
                expect(res).to.have.status(403)
                return
            }
            expect(res).to.have.status(403)
            expect(res.body.error).to.equal("User has insufficient privilege to complete this request.")
            expect(res.body.detail).to.equal("The labelId is not associated with this Collection.")
        })
      })
      describe(`attachAssetsToStig - /collections/{collectionId}/stigs/{benchmarkId}/assets`, function () {
        it('Set the Assets mapped to a STIG', async function () {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.scrapCollection.collectionId}/stigs/${reference.scrapAsset.scrapBenchmark}/assets?projection=restrictedUserAccess`)
          .set('Authorization', 'Bearer ' + iteration.token)
          .send([reference.scrapAsset.assetId])

          if(!distinct.canModifyCollection){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.an('array').of.length(1)
          expect(res.body[0].assetId).to.equal(reference.scrapAsset.assetId)
          expect(res.body[0].collectionId).to.equal(reference.scrapCollection.collectionId)
          expect(res.body[0]).to.have.property('restrictedUserAccess')
        })
        it('should throw SM privilege error due to assetId not being apart of collection.', async function () {
          const res = await chai.request(config.baseUrl)
          .put(`/collections/${reference.scrapCollection.collectionId}/stigs/${reference.scrapAsset.scrapBenchmark}/assets?projection=restrictedUserAccess`)
          .set('Authorization', 'Bearer ' + iteration.token)
          .send([`${Math.floor(Math.random() * 123456)}`])
          expect(res).to.have.status(403)
        })
      })
    })
  }
})

      

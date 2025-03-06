
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { expect } from 'chai'

function generateAssets(n) {
  const assets = []

  for (let i = 0; i < n; i++) {
      assets.push({
          name: 'Test' + utils.getUUIDSubString(10),
          description: 'test',
          ip: '1.1.1.1',
          noncomputing: true,
          // labelIds: [
          //     reference.testCollection.fullLabel,
          //     reference.testCollection.lvl1Label
          // ],
          labelIds: [ "a38806bf-4955-e85e-93b9-4bdb2f8376a4"],
          metadata: {
              pocName: 'pocName',
          },
          // stigs: reference.testCollection.validStigs
          stigs: ["badData", "bnadData", "baddata"]
      });
  }

  return assets;
}

function generateLabels(n) {
  const labels = []

  for (let i = 0; i < n; i++) {
      labels.push({
          name: utils.getUUIDSubString(10),
          description: 'test',
          color: 'a1b2c3'
      });
  }

  return labels;
}

describe('POST - Asset', function () {

  before(async function () {  
   // await utils.loadAppData()
  })

  for (const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }
    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
      describe(`createAsset - /assets`, function () {
        // it('Create an Asset (with statusStats and stigs projection', async function () {
        //   const res = await utils.executeRequest(`${config.baseUrl}/assets?projection=statusStats&projection=stigs`, 'POST', iteration.token, {
        //       name: 'TestAsset' + utils.getUUIDSubString(10),
        //       collectionId: reference.testCollection.collectionId,
        //       description: 'test',
        //       ip: '1.1.1.1',
        //       noncomputing: true,
        //       labelIds: [reference.testCollection.fullLabel],
        //       metadata: {
        //         pocName: 'pocName',
        //         pocEmail: 'pocEmail@example.com',
        //         pocPhone: '12345',
        //         reqRar: 'true'
        //       },
        //       stigs: reference.testCollection.validStigs
        //     })
          
        //     if(!distinct.canModifyCollection){
        //       expect(res.status).to.eql(403)
        //       return
        //     }
        //     expect(res.status).to.eql(201)
            
        //     expect(res.body.collection.collectionId).to.equal(reference.testCollection.collectionId)
        //     expect(res.body.name).to.be.a('string')
        //     expect(res.body.ip).to.equal('1.1.1.1')
        //     expect(res.body.noncomputing).to.equal(true)
        //     expect(res.body.labelIds).to.eql([reference.testCollection.fullLabel])
        //     expect(res.body.metadata.pocName).to.equal('pocName')
        //     expect(res.body.metadata.pocEmail).to.equal('pocEmail@example.com')
        //     expect(res.body.stigs).to.be.an('array').of.length(reference.testCollection.validStigs.length)
        //     expect(res.body).to.have.property('statusStats')
        //     expect(res.body.statusStats.maxTs).to.be.null
        //     expect(res.body.statusStats.minTs).to.be.null
        //     expect(res.body.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)
        //     expect(res.body.statusStats.stigCount).to.equal(reference.testAsset.stats.stigCount)
        //     expect(res.body.statusStats.savedCount).to.equal(0)
        //     expect(res.body.statusStats.acceptedCount).to.equal(0)
        //     expect(res.body.statusStats.rejectedCount).to.equal(0)

        //     for(const stig of res.body.stigs) {
        //       expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
        //     }

        //     const effectedAsset = await utils.getAsset(res.body.assetId)

        //     expect(effectedAsset.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)

        // })
        // it('should fail, duplicate asset name', async function () {

        //   const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
        //       name: reference.testAsset.name,
        //       collectionId: reference.testCollection.collectionId,
        //       description: 'test',
        //       ip: '1.1.1.1',
        //       noncomputing: true,
        //       labelIds: [reference.testCollection.fullLabel],
        //       metadata: {
        //         pocName: 'pocName',
        //       },
        //       stigs: reference.testCollection.validStigs
        //   })
        //   if(!distinct.canModifyCollection){
        //     expect(res.status).to.eql(403)
        //     return
        //   }
        //   expect(res.status).to.eql(422)
        // })
        // it('Create an Asset', async function () {
        //   const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
        //       name: 'TestAsset' + utils.getUUIDSubString(10),
        //       collectionId: reference.testCollection.collectionId,
        //       description: 'test',
        //       ip: '1.1.1.1',
        //       noncomputing: true,
        //       labelIds: [reference.testCollection.fullLabel],
        //       metadata: {
        //         pocName: 'pocName',
        //         pocEmail: 'pocEmail@example.com',
        //         pocPhone: '12345',
        //         reqRar: 'true'
        //       },
        //       stigs: reference.testCollection.validStigs
        //     })
          
        //   if(!distinct.canModifyCollection){
        //     expect(res.status).to.eql(403)
        //     return
        //   }
        //   expect(res.status).to.eql(201)         
        // })
        // it("Create Assets in batch", async function () {

        //   const assets = [{
        //     name: 'TestAsset' + utils.getUUIDSubString(10),
        //     description: 'batch',
        //     ip: '1.1.1.1',
        //     noncomputing: true,
        //     labelIds: [reference.testCollection.fullLabel, reference.testCollection.lvl1Label],
        //     metadata: {
        //       batch: 'batch',
        //       batch2: 'batch2'
        //     },
        //     stigs: reference.testCollection.validStigs
        //   },
        //   {
        //     name: 'TestAsset' + utils.getUUIDSubString(10),
        //     description: 'batch',
        //     ip: '1.1.1.1',
        //     noncomputing: true,
        //     labelIds: [],
        //     metadata: {
        //       batch: 'batch',
        //     },
        //     stigs: []
        //   }]

        //   const res = await utils.executeRequest(`${config.baseUrl}/collection/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
        //     {
        //     collectionId: reference.testCollection.collectionId,
        //     assets:assets
        //     })
            
        //   if(!distinct.canModifyCollection){
        //     expect(res.status).to.eql(403)
        //     return
        //   }
        //   expect(res.status).to.eql(201)
        //   expect(res.body).to.be.an('array').of.length(2)
        //   expect(res.body[0].name).to.equal(assets[0].name)
        //   expect(res.body[1].name).to.equal(assets[1].name)
        //   for(const asset of res.body) {
        //     expect(asset.ip).to.equal('1.1.1.1')
        //     expect(asset.noncomputing).to.equal(true)
        //     expect(asset.mac).to.be.null
        //     expect(asset.collection.collectionId).to.equal(reference.testCollection.collectionId)
           
        //     expect(asset.statusStats.maxTs).to.be.null
        //     expect(asset.statusStats.minTs).to.be.null
            
        //     expect(asset.metadata.batch).to.equal('batch')
        //     if(asset.name === assets[0].name){
        //       expect(asset.labelIds).to.eql([reference.testCollection.fullLabel, reference.testCollection.lvl1Label])
        //       expect(asset.statusStats.stigCount).to.be.eql(2)
        //       expect(asset.statusStats.ruleCount).to.be.eql(368)
        //       for(const stig of asset.stigs) {
        //         expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
        //       }
        //     }
        //     else {
        //       expect(asset.labelIds).to.eql([])
        //       expect(asset.statusStats.stigCount).to.be.eql(0)
        //       expect(asset.statusStats.ruleCount).to.be.eql(null)
        //       expect(asset.stigs).to.be.an('array').of.length(0)
        //     }
        //   }
        // })
        // it("Create Assets in batch, one asset", async function () {

        //   const assets = [
        //   {
        //     name: 'TestAsset' + utils.getUUIDSubString(10),
        //     description: 'batch',
        //     ip: '1.1.1.1',
        //     noncomputing: true,
        //     labelIds: [reference.testCollection.fullLabel, reference.testCollection.lvl1Label],
        //     metadata: {
        //       batch: 'batch',
        //     },
        //     stigs: reference.testCollection.validStigs
        //   }]

        //   const res = await utils.executeRequest(`${config.baseUrl}/collection/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
        //     {
        //     collectionId: reference.testCollection.collectionId,
        //     assets:assets
        //     })
            
        //   if(!distinct.canModifyCollection){
        //     expect(res.status).to.eql(403)
        //     return
        //   }
        //   expect(res.status).to.eql(201)
        //   expect(res.body).to.be.an('array').of.length(1)
        //   expect(res.body[0].name).to.equal(assets[0].name)
        //   for(const asset of res.body) {
        //     expect(asset.ip).to.equal('1.1.1.1')
        //     expect(asset.noncomputing).to.equal(true)
        //     expect(asset.mac).to.be.null
        //     expect(asset.collection.collectionId).to.equal(reference.testCollection.collectionId)
        //     expect(asset.labelIds).to.eql([reference.testCollection.fullLabel, reference.testCollection.lvl1Label])
        //     expect(asset.statusStats.maxTs).to.be.null
        //     expect(asset.statusStats.minTs).to.be.null
        //     expect(asset.statusStats.stigCount).to.be.eql(2)
        //     expect(asset.statusStats.ruleCount).to.be.eql(368)
        //     expect(asset.metadata.batch).to.equal('batch')
        //     for(const stig of asset.stigs) {
        //       expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
        //     }
        //   }
        // })
        // it("create asset with same name as test asset in test collection (expect 422)", async function () {

        //   const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
        //       name: reference.testAsset.name,
        //       collectionId: reference.testCollection.collectionId,
        //       description: 'test',
        //       ip: '1.1.1.1',
        //       noncomputing: true,
        //       labelIds: [reference.testCollection.fullLabel],
        //       metadata: {
        //         pocName: 'pocName',
        //         pocEmail: 'pocEmail@example.com',
        //         pocPhone: '12345',
        //         reqRar: 'true'
        //       },
        //       stigs: reference.testCollection.validStigs
        //     })
        //   if(!distinct.canModifyCollection){
        //     expect(res.status).to.eql(403)
        //     return
        //   }
        //   expect(res.status).to.eql(422)
        // })
        it("delete later", async function () {

          const assets = generateAssets(1000, reference)

          const request = {
            assets: assets
          }

          // start time 
          const start = new Date().getTime()
          const res = await utils.executeRequest(`${config.baseUrl}/collection/21/assets`, 'POST', iteration.token,
            request
          )
          // end time
          const end = new Date().getTime()

          let duration = end - start
          console.log(`Duration: ${duration} ms`)
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

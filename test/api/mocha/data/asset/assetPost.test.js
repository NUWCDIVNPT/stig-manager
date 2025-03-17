
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

        before(async function () {  
          await utils.loadAppData()
        })

        it('Create an Asset (with statusStats and stigs projection', async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets?projection=statusStats&projection=stigs`, 'POST', iteration.token, {
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
            
            expect(res.body.collection.collectionId).to.equal(reference.testCollection.collectionId)
            expect(res.body.name).to.be.a('string')
            expect(res.body.ip).to.equal('1.1.1.1')
            expect(res.body.noncomputing).to.equal(true)
            expect(res.body.labelIds).to.eql([reference.testCollection.fullLabel])
            expect(res.body.metadata.pocName).to.equal('pocName')
            expect(res.body.metadata.pocEmail).to.equal('pocEmail@example.com')
            expect(res.body.stigs).to.be.an('array').of.length(reference.testCollection.validStigs.length)
            expect(res.body).to.have.property('statusStats')
            expect(res.body.statusStats.maxTs).to.be.null
            expect(res.body.statusStats.minTs).to.be.null
            expect(res.body.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)
            expect(res.body.statusStats.stigCount).to.equal(reference.testAsset.stats.stigCount)
            expect(res.body.statusStats.savedCount).to.equal(null)
            expect(res.body.statusStats.acceptedCount).to.equal(null)
            expect(res.body.statusStats.rejectedCount).to.equal(null)

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
              labelNames: [reference.testCollection.fullLabelName],
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
        it("create asset with name of a currently disabled asset", async function () {

          const name = "deletedAsset"
          const disabledAssetId = 247

          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
              name,
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelNames: [],
              metadata: {
                pocName: 'pocName',
              },
              stigs: []
            })

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)
          expect(res.body.name).to.equal(name)
          expect(res.body.assetId).to.not.equal(disabledAssetId)

        })
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
        })
        it("create asset with same name as test asset in test collection (expect 422)", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
              name: reference.testAsset.name,
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
          expect(res.status).to.eql(422)
        })
        it("Create asset that already exist, expect correct 422 response ", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
              name: reference.testAsset.name,
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelNames: [reference.testCollection.fullLabelName],
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

          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal('name exists')
          expect(res.body.detail[0].detail).to.eql({
            name: "Collection_X_lvl1_asset-1",
            assetIndex: 1,
          })

        })

        it("Create Asset with non-existing labelName, expect correct 422 response", async function () {


          const name = 'TestAsset' + utils.getUUIDSubString(10)

          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
              name,
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelNames: ["07285e36"],
              metadata: {
                pocName: 'pocName',
              },
              stigs: []

            })
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal("unknown labelName")
          expect(res.body.detail[0].detail).to.eql({
            name,
            labelName: "07285e36",
            assetIndex: 1,
            labelIndex: 1,
          })

        })

        it("Create Asset with non-existing benchmarkId, expect correct 422 response", async function () {

          const name = 'TestAsset' + utils.getUUIDSubString(10)
          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
              name,
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelNames: [reference.testCollection.fullLabelName],
              metadata: {
                pocName: 'pocName',
              },
              stigs: ["NotAStig"]
            })
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal("unknown benchmarkId")
          expect(res.body.detail[0].detail).to.eql({
            name,
            benchmarkId: "NotAStig",
            assetIndex: 1,
            benchmarkIdIndex: 1,
          })
        })
       
      })
      describe(`createAssets - /collections/{collectionId}/assets`, function () {

        before(async function () {  
          await utils.loadAppData()
        })

        it("Create Assets in batch all projections", async function () {

          const assets = [{
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
              batch2: 'batch2'
            },
            stigs: reference.testCollection.validStigs
          },
          {
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [],
            metadata: {
              batch: 'batch',
            },
            stigs: []
          }]

          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets
          )
            
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)
          expect(res.body).to.be.an('array').of.length(2)
          expect(res.body[0].name).to.equal(assets[0].name)
          expect(res.body[1].name).to.equal(assets[1].name)
          for(const asset of res.body) {
            expect(asset.ip).to.equal('1.1.1.1')
            expect(asset.noncomputing).to.equal(true)
            expect(asset.mac).to.be.null
            expect(asset.collection.collectionId).to.equal(reference.testCollection.collectionId)
           
            expect(asset.statusStats.maxTs).to.be.null
            expect(asset.statusStats.minTs).to.be.null
            
            expect(asset.metadata.batch).to.equal('batch')
            if(asset.name === assets[0].name){
              expect(asset.labelIds).to.eql([reference.testCollection.fullLabel, reference.testCollection.lvl1Label])
              expect(asset.statusStats.stigCount).to.be.eql(2)
              expect(asset.statusStats.ruleCount).to.be.eql(368)
              for(const stig of asset.stigs) {
                expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
              }
            }
            else {
              expect(asset.labelIds).to.eql([])
              expect(asset.statusStats.stigCount).to.be.eql(0)
              expect(asset.statusStats.ruleCount).to.be.eql(null)
              expect(asset.stigs).to.be.an('array').of.length(0)
            }
          }
        })
        it("Create Assets in batch, one asset", async function () {

          const assets = [
          {
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: reference.testCollection.validStigs
          }]

          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets
            )
            
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)
          expect(res.body).to.be.an('array').of.length(1)
          expect(res.body[0].name).to.equal(assets[0].name)
          for(const asset of res.body) {
            expect(asset.ip).to.equal('1.1.1.1')
            expect(asset.noncomputing).to.equal(true)
            expect(asset.mac).to.be.null
            expect(asset.collection.collectionId).to.equal(reference.testCollection.collectionId)
            expect(asset.labelIds).to.eql([reference.testCollection.fullLabel, reference.testCollection.lvl1Label])
            expect(asset.statusStats.maxTs).to.be.null
            expect(asset.statusStats.minTs).to.be.null
            expect(asset.statusStats.stigCount).to.be.eql(2)
            expect(asset.statusStats.ruleCount).to.be.eql(368)
            expect(asset.metadata.batch).to.equal('batch')
            for(const stig of asset.stigs) {
              expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
            }
          }
        })

        it("create two incorrect asssets both have stig that doesnt exist", async function () {

          const assets = [{
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: ["NotAStig"]
          },
          {
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: ["NotAStig"]
          }]

          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets
            )

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(2)
          for(const error of res.body.detail) {
            expect(error.failure).to.equal("unknown benchmarkId")
            if(error.detail.name === assets[0].name){
              expect(error.detail).to.eql({
                name: assets[0].name,
                benchmarkId: "NotAStig",
                assetIndex: 1,
                benchmarkIdIndex: 1,
              })
            }
            else {
              expect(error.detail).to.eql({
                name: assets[1].name,
                benchmarkId: "NotAStig",
                assetIndex: 2,
                benchmarkIdIndex: 1,
              })
            }
          }

        })

        it("Pass non existing collectionId", async function () {

          const assets = [{
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: reference.testCollection.validStigs
          }]
          const res = await utils.executeRequest(`${config.baseUrl}/collections/999/assets`, 'POST', iteration.token,
            assets
            )
          
          expect(res.status).to.eql(403)
        })

        it("Pass disabled collectionId", async function () {

          const assets = [{
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: reference.testCollection.validStigs
          }]
          const res = await utils.executeRequest(`${config.baseUrl}/collections/93/assets`, 'POST', iteration.token,
            assets
            )
          expect(res.status).to.eql(403)

        })

        it("Pass empty assets array", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets`, 'POST', iteration.token,
           []
            )
          expect(res.status).to.eql(400)

        })

        it("Create assets with one that already exists, expect correct 422 response ", async function () {

          const assets = [
            {
              name: 'TestAsset' + utils.getUUIDSubString(10),
              description: 'batch',
              ip: '1.1.1.1',
              noncomputing: true,
              labelNames: [],
              metadata: {
                batch: 'batch',
              },
              stigs: []
            },{
            name: reference.testAsset.name,
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: reference.testCollection.validStigs
          }
        ]

          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            
            assets
            )

          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal('name exists')
          expect(res.body.detail[0].detail).to.eql({
            name: reference.testAsset.name,
            assetIndex: 2,
          })

        })

        it("Create Assets where one has non-existing labelName, expect correct 422 response", async function () {
          
          const assets = [{
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: ["unknownLabel"],
            metadata: {
              batch: 'batch',
            },
            stigs: []
          },
          {
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: reference.testCollection.validStigs
          }]
          
          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets )
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal("unknown labelName")
          expect(res.body.detail[0].detail).to.eql({
            name: assets[0].name,
            labelName: "unknownLabel",
            assetIndex: 1,
            labelIndex: 1,
          })
        })

        it("Create Assets where one has a non-existing benchmarkId, expect correct 422 response", async function () {

          const assets = [{
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: ["NotAStig"]
          },
          {
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: reference.testCollection.validStigs
          }]

          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets )
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal("unknown benchmarkId")
          expect(res.body.detail[0].detail).to.eql({
            name: assets[0].name,
            benchmarkId: "NotAStig",
            assetIndex: 1,
            benchmarkIdIndex: 1,
          })
          

        })

        it("Create Assets where one has one correct label/benchmark and one non-existing label/benchmark, expect correct 422 response", async function () {
          
          const assets = [{
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [reference.testCollection.fullLabelName, reference.testCollection.lvl1LabelName],
            metadata: {
              batch: 'batch',
            },
            stigs: []
          },
          {
            name: 'TestAsset' + utils.getUUIDSubString(10),
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: ["unknownLabel"],
            metadata: {
              batch: 'batch',
            },
            stigs: ["NotAStig"]
          }]

          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets )
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(2)
          for(const error of res.body.detail) {
            expect(error.failure).to.be.oneOf(["unknown labelName", "unknown benchmarkId"])
            if(error.failure === "unknown labelName"){
              expect(error.detail).to.eql({
                name: assets[1].name,
                labelName: "unknownLabel",
                assetIndex: 2,
                labelIndex: 1,
              })
            }
            else {
              expect(error.detail).to.eql({
                name: assets[1].name,
                benchmarkId: "NotAStig",
                assetIndex: 2,
                benchmarkIdIndex: 1,
              })
            }
          }
        })

        it("Create Duplicate Asset with not-existing benchmark/labelName expect correct 422", async function () {

          const assets = [{
            name: reference.testAsset.name,
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: ["unknownLabel"],
            metadata: {
              batch: 'batch',
            },
            stigs: ["NotAStig"]
          }]
          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets )
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal("name exists")
          expect(res.body.detail[0].detail).to.eql({
            name: reference.testAsset.name,
            assetIndex: 1,
          })
        })

        it("Create Duplicate Asset with not-existing benchmark/labelName expect correct 422", async function () {

          const assets = [{
            name: reference.testAsset.name,
            description: 'batch',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: ["unknownLabel"],
            metadata: {
              batch: 'batch',
            },
            stigs: ["NotAStig"]
          }]
          const res = await utils.executeRequest(`${config.baseUrl}/collections/21/assets?projection=stigs&projection=statusStats`, 'POST', iteration.token,
            assets )
          if(!distinct.canModifyCollection){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.detail).to.be.an('array').of.length(1)
          expect(res.body.detail[0].failure).to.equal("name exists")
          expect(res.body.detail[0].detail).to.eql({
            name: reference.testAsset.name,
            assetIndex: 1,
          })
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

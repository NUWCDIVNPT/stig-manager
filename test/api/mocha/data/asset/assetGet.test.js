
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { XMLParser } from 'fast-xml-parser'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)

describe(`GET - Asset`, function () {

  before(async function () {
    await utils.loadAppData()
  })

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]

      describe(`getAsset - /assets/{assetId}`, function () {
      
        it(`Return test asset`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs`, 'GET', iteration.token)

          if(distinct.hasAccessToTestAsset === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.name, `expect asset name to equal test asset ${reference.testAsset.name}`).to.eql(reference.testAsset.name)
          expect(res.body.collection.collectionId, `expect asset to be a part of test collection ${reference.testAsset.collectionId}`).to.eql(reference.testAsset.collectionId)
          expect(res.body.collection.name, `expect collection name to equal test collection ${reference.testCollection.name}`).to.eql(reference.testCollection.name)
          expect(res.body.labelIds, `expect asset to have a label length ${reference.testAsset.labels.length}`).to.be.an(`array`).of.length(reference.testAsset.labels.length)
          for(const label of res.body.labelIds){
            expect(label, "expect label to be one of the test labels").to.be.oneOf(reference.testAsset.labels)
          }
          expect(res.body.metadata, "expect metadata to equal test metadata").to.deep.equal({
            [reference.testAsset.metadataKey]: reference.testAsset.metadataValue
          })
          // stigs projection
          expect(res.body.stigs).to.be.an("array").of.length(distinct.testAssetStigs.length)
          for (let stig of res.body.stigs){
              expect(stig.benchmarkId).to.be.oneOf(distinct.testAssetStigs);
          }
          // statusStats projection
          expect(res.body.statusStats.ruleCount, `rule count ${distinct.testAssetStats.ruleCount}`).to.eql(distinct.testAssetStats.ruleCount)
          expect(res.body.statusStats.stigCount, `stig count ${distinct.testAssetStats.stigCount}`).to.eql(distinct.testAssetStats.stigCount)
          expect(res.body.statusStats.savedCount, "saved count: " + distinct.testAssetStats.savedCount ).to.eql(distinct.testAssetStats.savedCount)
          expect(res.body.statusStats.acceptedCount, "accepted count").to.eql(distinct.testAssetStats.acceptedCount)
          expect(res.body.statusStats.rejectedCount, "rejected count").to.eql(distinct.testAssetStats.rejectedCount)
          expect(res.body.statusStats.submittedCount, "submitted count").to.eql(distinct.testAssetStats.submittedCount)

        })
        // it(`Return an Asset with no assigned stigs`, async function () {
        //   const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAssetNoStigs.assetId}?projection=statusStats&projection=stigs`, 'GET', iteration.token)

        //   if(distinct.hasAccessToTestAssetNoStigs === false){
        //     expect(res.status).to.eql(403)
        //     return
        //   }
        //   else{
        //     expect(res.status).to.eql(200)
        //   }
        //   expect(res.body.name).to.eql(reference.testAssetNoStigs.name)
        //   expect(res.body.collection.collectionId).to.eql(reference.testAssetNoStigs.collectionId)
        //   expect(res.body.labelIds).to.be.an(`array`).of.length(reference.testAssetNoStigs.labels.length)

        //   // stigs
        //   expect(res.body.stigs).to.be.an("array").of.length(reference.testAssetNoStigs.stigs.length)

        //   // statusStats
        //   expect(res.body.statusStats.ruleCount, "rule count").to.eql(reference.testAssetNoStigs.stats.ruleCount)
        //   expect(res.body.statusStats.stigCount, "stig Count").to.eql(reference.testAssetNoStigs.stats.stigCount)
        //   expect(res.body.statusStats.savedCount, "saved Count").to.eql(reference.testAssetNoStigs.stats.savedCount)
        //   expect(res.body.statusStats.acceptedCount, "accepted Count").to.eql(reference.testAssetNoStigs.stats.acceptedCount)
        //   expect(res.body.statusStats.rejectedCount, "rejected count").to.eql(reference.testAssetNoStigs.stats.rejectedCount)
        //   expect(res.body.statusStats.submittedCount, "submitted count").to.eql(reference.testAssetNoStigs.stats.submittedCount)
        //   expect(res.body.statusStats.acceptedCount, "accepted count").to.eql(reference.testAssetNoStigs.stats.acceptedCount)

        // })
        // it(`Return test asset`, async function () {
        //   const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}?projection=statusStats&projection=stigs`, 'GET', iteration.token)

        //   if(!distinct.hasAccessToTestAsset){
        //     expect(res.status).to.eql(403)
        //     return
        //   }

        //   expect(res.status).to.eql(200)
        //   expect(res.body).to.be.an(`object`)        
        //   expect(res.body.name).to.eql(reference.testAsset.name)
        //   expect(res.body.collection.collectionId).to.eql(reference.testAsset.collectionId)
        //   expect(res.body.collection.name, "expect collection name to equal test collection").to.eql(reference.testCollection.name)
        //   expect(res.body.labelIds).to.be.an(`array`).of.length(reference.testAsset.labels.length)
        //   for(const label of res.body.labelIds){
        //     expect(label).to.be.oneOf(reference.testAsset.labels)
        //   }
        //   expect(res.body.metadata).to.deep.equal({
        //     [reference.testAsset.metadataKey]: reference.testAsset.metadataValue
        //   })
        //   //stigs
        //   expect(res.body.stigs).to.exist;
        //   expect(res.body.stigs).to.be.an("array").of.length(distinct.testAssetStigs.length)
        //   for (let stig of res.body.stigs){
        //       expect(stig.benchmarkId).to.be.oneOf(reference.testAsset.validStigs);
        //   }

        //   // statusStats
        //   expect(res.body.statusStats.ruleCount, "rule count").to.eql(distinct.testAssetStats.ruleCount)
        //   expect(res.body.statusStats.stigCount, "stig count").to.eql(distinct.testAssetStats.stigCount)
        //   expect(res.body.statusStats.savedCount, "saved count").to.eql(distinct.testAssetStats.savedCount)
        //   expect(res.body.statusStats.acceptedCount, "accepted count").to.eql(distinct.testAssetStats.acceptedCount)
        //   expect(res.body.statusStats.rejectedCount, "rejected count").to.eql(distinct.testAssetStats.rejectedCount)
        //   expect(res.body.statusStats.submittedCount, "submitted count").to.eql(distinct.testAssetStats.submittedCount)

        // })
        // it(`Return an Asset  with no assigned stigs`, async function () {
        //   const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAssetNoStigs.assetId}?projection=statusStats&projection=stigs`, 'GET', iteration.token)

        //     if(!distinct.hasAccessToTestAssetNoStigs){
        //       expect(res.status).to.eql(403)
        //       return
        //     }
        //     else{
        //       expect(res.status).to.eql(200)
        //     }
        //     expect(res.body.name).to.eql(reference.testAssetNoStigs.name)
        //     expect(res.body.collection.collectionId).to.eql(reference.testAssetNoStigs.collectionId)
        //     expect(res.body.labelIds).to.be.an(`array`).of.length(reference.testAssetNoStigs.labels.length)
        //     expect(res.body.collection.name, "expect collection name to equal test collection").to.eql(reference.testCollection.name)
        //     expect(res.body.labelIds).to.be.an(`array`).of.length(reference.testAssetNoStigs.labels.length)
        //     for(const label of res.body.labelIds){
        //       expect(label).to.be.oneOf(reference.testAssetNoStigs.labels)
        //     }

        //     // stigs
        //     expect(res.body.stigs).to.be.an("array").of.length(reference.testAssetNoStigs.stigs.length)
  
        //     // statusStats
        //     expect(res.body.statusStats.ruleCount, "rule count").to.eql(reference.testAssetNoStigs.stats.ruleCount)
        //     expect(res.body.statusStats.stigCount, "stig Count").to.eql(reference.testAssetNoStigs.stats.stigCount)
        //     expect(res.body.statusStats.savedCount, "saved Count").to.eql(reference.testAssetNoStigs.stats.savedCount)
        //     expect(res.body.statusStats.acceptedCount, "accepted Count").to.eql(reference.testAssetNoStigs.stats.acceptedCount)
        //     expect(res.body.statusStats.rejectedCount, "rejected count").to.eql(reference.testAssetNoStigs.stats.rejectedCount)
        //     expect(res.body.statusStats.submittedCount, "submitted count").to.eql(reference.testAssetNoStigs.stats.submittedCount)
        //     expect(res.body.statusStats.acceptedCount, "accepted count").to.eql(reference.testAssetNoStigs.stats.acceptedCount)
        // })
      })
      describe(`getAssetMetadata - /assets/{assetId}/metadata,`, function () {
        it(`Return the Metadata for test asset`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/metadata`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`object`)      
          expect(res.body.testkey).to.exist
          expect(res.body.testkey).to.eql(reference.testAsset.metadataValue)
        })
      })
      describe(`getAssetMetadataKeys - /assets/{assetId}/metadata/keys`, function () {
        it(`Return the Metadata KEYS for test asset`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/metadata/keys`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`)
          expect(res.body).to.include(reference.testAsset.metadataKey)
        })
        it(`should return emoty 200 response no metadata for asset`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAssetNoMetadata.assetId}/metadata/keys`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
        })
      })
      describe(`getAssetMetadataValue - /assets/{assetId}/metadata/keys/{key}`, function () {
        it(`Return the Metadata VALUE for test asset metadata key: testkey`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/metadata/keys/${reference.testAsset.metadataKey}`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.include(reference.testAsset.metadataValue)
        })
        it(`should throw not found error, metadata keys not found`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAssetNoMetadata.assetId}/metadata/keys/test`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(404)
        })
      })
      describe(`getAssets - /assets`, function () {

        it(`Assets accessible to the requester benchmark projection with test benchmark`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&benchmarkId=${reference.benchmark}&projection=stigs`, 'GET', iteration.token)
          if(distinct.hasAccessToTestAsset === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableBenchmark.length)
          for(const asset of res.body){
            expect(asset.assetId).to.be.oneOf(distinct.assetsAvailableBenchmark)
            expect(reference.benchmark).to.be.oneOf(asset.stigs.map(stig => stig.benchmarkId))
            if(asset.assetId === reference.testAsset.assetId){
              expect(asset.name, "expect asset name to equal test asset").to.eql(reference.testAsset.name)
              expect(asset.collection.collectionId, "expect asset to be a part of test collection").to.eql(reference.testAsset.collectionId)
              expect(asset.collection.name, "expect collection name to equal test collection").to.eql(reference.testCollection.name)
              expect(asset.labelIds).to.be.an(`array`).of.length(reference.testAsset.labels.length)
              for(const label of asset.labelIds){
                expect(label).to.be.oneOf(reference.testAsset.labels)
              }
              expect(asset.metadata).to.deep.equal({
                [reference.testAsset.metadataKey]: reference.testAsset.metadataValue
              })
            }            
          }
        })

        it(`Assets accessible to the requester`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&projection=statusStats&projection=stigs`, 'GET', iteration.token)

          if(distinct.hasAccessToTestAsset === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetIds.length)
        
          const jsonData = res.body;
          for (let asset of jsonData){
            expect(asset.assetId).to.be.oneOf(distinct.assetIds)

            for(let stig of asset.stigs){
              expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs);
            }
            if(asset.assetId === reference.testAsset.assetId){
              expect(asset.name, "expect asset name to equal test asset").to.eql(reference.testAsset.name)
              expect(asset.collection.collectionId, "expect asset to be a part of test collection").to.eql(reference.testAsset.collectionId)
              expect(asset.collection.name, "expect collection name to equal test collection").to.eql(reference.testCollection.name)
              expect(asset.labelIds).to.be.an(`array`).of.length(reference.testAsset.labels.length)
              for(const label of asset.labelIds){
                expect(label).to.be.oneOf(reference.testAsset.labels)
              }
              expect(asset.metadata).to.deep.equal({
                [reference.testAsset.metadataKey]: reference.testAsset.metadataValue
              })
              expect(asset.statusStats.ruleCount).to.eql(distinct.testAssetStats.ruleCount);
            }            
          }
        })

        it(`Assets accessible to the requester - labels projection on full label`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableFullLabel.length)
          for(let asset of res.body){
            expect(asset.labelIds).to.include(reference.testCollection.fullLabel)
          }
        })

        it(`should return assets accessible to the requester, testing metadata query. (issue 1357)`, async function () {
          const assetWithMetadata = await utils.createTempAsset({
            name: 'tempAsset' + utils.getUUIDSubString(),
            collectionId: reference.scrapCollection.collectionId,
            description: 'temp',
            ip: '1.1.1.1',
            noncomputing: true,
            labelNames: [],
            metadata: {
              testKey: 'test:value',
            },
            stigs: []
          })

          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.scrapCollection.collectionId}&metadata=testKey%3Atest%3Avalue`, 'GET', iteration.token)
          
          if(iteration.name === 'lvl1' || iteration.name === 'collectioncreator'){
            expect(res.status).to.eql(403)
            await utils.deleteAsset(assetWithMetadata.assetId)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(1)
          expect(res.body[0].assetId).to.eql(assetWithMetadata.assetId)
          await utils.deleteAsset(assetWithMetadata.assetId)
        })

        it(`Assets accessible to the requester`, async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&benchmarkId=${reference.benchmark}`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableBenchmark.length)
          
          const jsonData = res.body;
          
          for (const asset of jsonData){
            expect(asset.assetId, "expect assetId to be within the parameters of test collection and have test benchmark").to.be.oneOf(distinct.assetsAvailableBenchmark)
            if(asset.assetId === reference.testAsset.assetId){
              expect(asset.name, "expect asset name to equal test asset").to.eql(reference.testAsset.name)
              expect(asset.collection.collectionId, "expect asset to be a part of test collection").to.eql(reference.testAsset.collectionId)
              expect(asset.collection.name, "expect collection name to equal test collection").to.eql(reference.testCollection.name)
              expect(asset.labelIds).to.be.an(`array`).of.length(reference.testAsset.labels.length)
              for(const label of asset.labelIds){
                expect(label, "expect label to be a valid label").to.be.oneOf(reference.testAsset.labels)
              }
              expect(asset.metadata, "expect metadata to match test asset").to.deep.equal({
                [reference.testAsset.metadataKey]: reference.testAsset.metadataValue
              })
            }
          }
        })

        it("assets accessible to the requester labels predicate for label name, full label.", async function () {

          const res  =  await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200) 

          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableFullLabel.length)
          for(let asset of res.body){
            expect(asset.labelIds).to.include(reference.testCollection.fullLabel)
            expect(asset.assetId).to.be.oneOf(distinct.assetsAvailableFullLabel)
            expect(asset.collection.collectionId).to.eql(reference.testCollection.collectionId)
          }
        })

        it("assets accessible to the requester label match predicate is null, should return assets without metadata", async function () {

          const res  =  await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&labelMatch=null`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200) 

          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableNoMetadata.length)
          for(let asset of res.body){
            expect(asset.labelIds).to.be.empty
            expect(asset.assetId).to.be.oneOf(distinct.assetsAvailableNoMetadata)
            expect(asset.collection.collectionId).to.eql(reference.testCollection.collectionId)
          }
        })

        it("assets accessible to the requester name match predicate where asset name is exact should return test asset", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&name=${reference.testAsset.name}&name-match=exact`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(1)
          expect(res.body[0].assetId).to.eql(reference.testAsset.assetId)
        })
        it("assets accessible to the requester name match predicate where asset name starts with should return assets start with Co", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&name=${"Co"}&name-match=startsWith`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          const assetNamesStartWithCo = distinct.AssetNamesAvailable.filter(asset => asset.name.startsWith("Co"))
          expect(res.body).to.be.an(`array`).of.length(3)
          for(const asset of res.body){
            expect(asset.name).to.match(/^Co/)
            expect(asset.assetId).to.be.oneOf(reference.testCollection.assetIds)
          }
        })
        it("assets accessible to the requester name match predicate where asset name ends with should return assets with `asset`", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&name=${"asset"}&name-match=endsWith`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          const names = distinct.AssetNamesAvailable.filter(asset => asset.name.endsWith("asset"))
          if(iteration.name === 'lvl1'){
            expect(res.body).to.be.an(`array`).of.length(1)
          }
          else {
            expect(res.body).to.be.an(`array`).of.length(2)
          }
          for(const asset of res.body){
            expect(asset.assetId).to.be.oneOf(reference.testCollection.assetIds)
          }
        })
        it("assets accessible to the requester name match predicate where asset name contains should return assets containg `lvl`", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&name=${"lvl"}&name-match=contains`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          const names = distinct.AssetNamesAvailable.filter(asset => asset.name.includes("lvl"))
          expect(res.body).to.be.an(`array`).of.length(names.length)
          for(const asset of res.body){
            expect(asset.assetId).to.be.oneOf(names.map(asset => asset.assetId))
          }
        })
        it("should not filter on name even with name-match=exact because no name predicate was passed.", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets?collectionId=${reference.testCollection.collectionId}&name-match=exact`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetIds.length)
        })
      })
      describe(`getChecklistByAsset - /assets/{assetId}/checklists`, function () {

        it(`Return the Checklist for the test Asset with benchmark query param of test benchmark (VPN_SRG_TEST)`, async function () {

          const url = `${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists?benchmarkId=${reference.benchmark}`
          const options = {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${iteration.token}`,
            },
          }
    
          const res = await fetch(url, options)
    
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }

          const bodyText = await res.text()
          expect(res.status).to.eql(200)

          let cklData

          const parser = new XMLParser()
          cklData = parser.parse(bodyText)

          let cklHostName = cklData.CHECKLIST.ASSET.HOST_NAME
          let cklIStigs = cklData.CHECKLIST.STIGS.iSTIG
      
          const regex = new RegExp(distinct.assetMatchString)
          expect(cklHostName).to.match(regex)
          let currentStigId 
          for(const stigData of cklIStigs.STIG_INFO.SI_DATA){
            if (stigData.SID_NAME == `stigid`){
              currentStigId = stigData.SID_DATA
              expect(currentStigId).to.be.eql(reference.benchmark)
          }
          }
          let cklVulns = cklIStigs.VULN;
          expect(cklVulns).to.be.an(`array`);
          if (currentStigId == reference.benchmark) {
              expect(cklVulns).to.be.an(`array`).of.length(reference.checklistLength);
          }
        })

        it(`Return the Checklist for the test Asset and MULTI-STIG JSON (.cklB)`, async function () {
            
            const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists?format=cklb`, 'GET', iteration.token)

            if(!distinct.hasAccessToTestAsset){
              expect(res.status).to.eql(403)
              return
            }
      
            expect(res.status).to.eql(200)
            let cklbData = res.body
            let cklbHostName = cklbData.target_data.host_name
            let cklbIStigs = cklbData.stigs

            const regex = new RegExp(distinct.assetMatchString)
            expect(cklbHostName).to.match(regex)

            for (let stig of cklbIStigs){
              let stigId = stig.stig_id
              expect(stigId).to.be.oneOf(reference.testCollection.validStigs)
              let cklbVulns = stig.rules;
              expect(cklbVulns).to.be.an(`array`);
              if (stigId == reference.benchmark) {
                  expect(cklbVulns).to.be.an(`array`).of.length(reference.checklistLength);
              }
            }
        })

        it(`Return the Checklist for the test Asset and MULTI-STIG JSON (.cklB) - specific STIGs specified`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists?format=cklb&benchmarkId=${reference.benchmark}&benchmarkId=Windows_10_STIG_TEST`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          if(distinct.grant === `restricted`){
            expect(res.status).to.eql(400)
            return
          }
          expect(res.status).to.eql(200)
          let cklbData = res.body
          let cklbHostName = cklbData.target_data.host_name
          let cklbIStigs = cklbData.stigs

          const regex = new RegExp(distinct.assetMatchString)
          expect(cklbHostName).to.match(regex)

          for (let stig of cklbIStigs){
            let stigId = stig.stig_id
            expect(stigId).to.be.oneOf(reference.testCollection.validStigs)
            let cklbVulns = stig.rules;
            expect(cklbVulns).to.be.an(`array`);
            if (stigId == reference.benchmark) {
                expect(cklbVulns).to.be.an(`array`).of.length(reference.checklistLength);
            }
          }

        })

        it(`Return the Checklist for the test Asset and MULTI-STIG XML (.CKL) - no specified stigs`, async function () {

          const url = `${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists/`
          const options = {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${iteration.token}`,
            },
          }
    
          const res = await fetch(url, options)
    
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }

          const bodyText = await res.text()
          expect(res.status).to.eql(200)

          let cklData

          const parser = new XMLParser()
          cklData = parser.parse(bodyText)

          let cklHostName = cklData.CHECKLIST.ASSET.HOST_NAME
          let cklIStigs = [cklData.CHECKLIST.STIGS.iSTIG]

          const regex = new RegExp(distinct.assetMatchString)
          expect(cklHostName).to.match(regex)

          if(iteration.name === 'lvl1'){
            cklIStigs = [cklIStigs]
          }

          for (let stig of cklIStigs[0]){
            let currentStigId
            let referenceStig
            for(let stigData of stig.STIG_INFO.SI_DATA){
              if (stigData.SID_NAME == `stigid`){
                currentStigId = stigData.SID_DATA
                expect(currentStigId).to.be.oneOf(reference.testCollection.validStigs)
                if(stigData.SID_DATA == reference.benchmark){
                  referenceStig = stig
                }
              }
            }
            if (referenceStig) {
              let referenceStigVulns = referenceStig.VULN
                expect(referenceStigVulns).to.be.an(`array`).of.length(reference.checklistLength)
            }
          }
        })

        it(`Return the Checklist for the supplied Asset and MULTI-STIG XML (.CKL) - specified stigs`, async function () {
          
          const url = `${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists?benchmarkId=${reference.benchmark}&benchmarkId=Windows_10_STIG_TEST`;
          const options = {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${iteration.token}`,
            },
          }
    
          // Fetch request
          const res = await fetch(url, options)
    
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          if(distinct.grant === `restricted`){
            expect(res.status).to.eql(400)
            return
          }
          
          expect(res.status).to.eql(200)
    
          let cklData

          const bodyText = await res.text()
    
          const parser = new XMLParser()
          cklData = parser.parse(bodyText)
    
          let cklHostName = cklData.CHECKLIST.ASSET.HOST_NAME
          let cklIStigs = cklData.CHECKLIST.STIGS.iSTIG
    
          const regex = new RegExp(distinct.assetMatchString)
          expect(cklHostName).to.match(regex)
          let currentStigId
          for (let stig of cklIStigs){
            for(let stigData of stig.STIG_INFO.SI_DATA){
              if (stigData.SID_NAME == `stigid`){
                currentStigId = stigData.SID_DATA
                expect(currentStigId).to.be.oneOf(reference.testCollection.validStigs)
            }
            }
            let cklVulns = stig.VULN;
            expect(cklVulns).to.be.an(`array`);
            if (currentStigId == reference.benchmark) {
                expect(cklVulns).to.be.an(`array`).of.length(reference.checklistLength);
            }
          }
        })

        it('should return 204, asset does not have checklists', async function () {

          //create asset with no checklists 
          const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', iteration.token, {
            name: `assetNoChecklists` + utils.getUUIDSubString(),
            collectionId: reference.testCollection.collectionId,
            description: `test`,
            ip: `1.1.1.1`,
            noncomputing: true,
            labelNames: [],
            metadata: {
              pocName: `pocName`,
            },
            stigs: []
          })
            if(!distinct.canModifyCollection){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(201)

            const assetId = res.body.assetId

            const res2 = await utils.executeRequest(`${config.baseUrl}/assets/${assetId}/checklists`, 'GET', iteration.token)
            expect(res2.status).to.eql(204)
            
            await utils.deleteAsset(assetId)
        })
      })
      describe(`getChecklistByAssetStig - /assets/{assetId}/checklists/{benchmarkId}/{revisionStr}`, function () {

        it(`Return the Checklist for the supplied Asset and benchmarkId and revisionStr`, async function () {

          const url = `${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists/${reference.benchmark}/${reference.revisionStr}?format=ckl`
          const options = {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${iteration.token}`,
            },
          }
    
          // Fetch request
          const res = await fetch(url, options)
    
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          
          expect(res.status).to.eql(200)
    
          let cklData

          const bodyText = await res.text()
    
          const parser = new XMLParser()
          cklData = parser.parse(bodyText)
    

          let cklHostName = cklData.CHECKLIST.ASSET.HOST_NAME
          let cklIStigs = cklData.CHECKLIST.STIGS.iSTIG

          const regex = new RegExp(distinct.assetMatchString)
          expect(cklHostName).to.match(regex)

          cklIStigs = [cklIStigs]
          let currentStigId
          for (let stig of cklIStigs){
            for(let stigData of stig.STIG_INFO.SI_DATA){
              if (stigData.SID_NAME == `stigid`){
                currentStigId = stigData.SID_DATA
                expect(currentStigId).to.be.eql(reference.benchmark)
            }
            }
            let cklVulns = stig.VULN
            expect(cklVulns).to.be.an(`array`)
            if (currentStigId == reference.benchmark) {
                expect(cklVulns).to.be.an(`array`).of.length(reference.checklistLength)
            }
          }
        })

        it(`Return the Checklist for the supplied Asset and benchmarkId and revisionStr json-access`, async function () {

          const url = `${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists/${reference.benchmark}/${reference.revisionStr}?format=json-access`
          const options = {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${iteration.token}`,
            },
          }
    
          const res = await fetch(url, options)
    
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          
          expect(res.status).to.eql(200)
    
          let cklData

          const bodyText = await res.json()

          for(const checklist of bodyText.checklist){
            expect(checklist.assetId).to.be.oneOf(reference.testCollection.assetIds)
            if(checklist.ruleId === reference.testCollection.ruleId){
              expect(checklist.ruleId).to.eql(reference.testCollection.ruleId)
              expect(checklist.assetId).to.eql(reference.testAsset.assetId)
              expect(checklist.result).to.eql("pass")
              expect(checklist.status).to.eql("submitted")
              expect(checklist.autoResult).to.eql(false)

            }
          }

        })

        it(`Return the Checklist for the supplied Asset and STIG XML (.cklB) - specific STIG`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists/${reference.benchmark}/${reference.revisionStr}?format=cklb`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)
        
          let cklbData = res.body
          let cklbHostName = cklbData.target_data.host_name
          let cklbIStigs = cklbData.stigs

          const regex = new RegExp(distinct.assetMatchString)
          expect(cklbHostName).to.match(regex)

          for (let stig of cklbIStigs){
            let stigId = stig.stig_id
            expect(stigId).to.be.oneOf(reference.testCollection.validStigs)
            let cklbVulns = stig.rules;
            expect(cklbVulns).to.be.an(`array`);
            if (stigId == reference.benchmark) {
                expect(cklbVulns).to.be.an(`array`).of.length(reference.checklistLength);
            }
          }
        })

        it(`Return the Checklist for the supplied Asset and STIG JSON`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/checklists/${reference.benchmark}/${reference.revisionStr}?format=json`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(reference.checklistLength)
        })
      })
      describe(`getStigsByAsset - /assets/{assetId}/stigs`, function () {

        it(`Return the Checklist for the supplied Asset and benchmarkId and revisionStr - rules`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/assets/${reference.testAsset.assetId}/stigs`, 'GET', iteration.token)
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.validStigs.length)
          for(let stig of res.body){
            expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
          }
        })
      })
      describe(`getAssetsByCollectionLabelId - /collections/{collectionId}/labels/{labelId}/assets`, function () {

        it(`Return the Checklist for the supplied Asset and benchmarkId - rules`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${reference.testCollection.fullLabel}/assets`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableFullLabel.length)
          
          for(let asset of res.body){
            expect(asset.assetId).to.be.oneOf(distinct.assetsAvailableFullLabel)
          }   
        })
      })
      describe(`getAssetsByStig - /collections/{collectionId}/stigs/{benchmarkId}/assets`, function () {

        it(`Assets in a Collection attached to a STIG`, async function () {
          
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}/assets`, 'GET', iteration.token)
            
          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableBenchmark.length)
          for(let asset of res.body){
            expect(asset.assetId, "expect assetId to be an asset attached to this bnenchmark").to.be.oneOf(distinct.assetsAvailableBenchmark)
            expect(asset.collectionId, "expect collectionId to be equal to reference.testCollection.collectionId").to.be.eql(reference.testCollection.collectionId)
            for(const label of asset.assetLabelIds){
              expect(label).to.be.oneOf(reference.testCollection.labels, `Label should be one of the valid labels`)
            }
            if(asset.access === "r"){
              expect(iteration.name).to.be.oneOf(['lvl1'])
            }
            else {
              expect(asset.access).to.be.oneOf(['rw'])
            }
          }   
        })
        it(`Assets in a Collection attached to a STIG - label-lvl1`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}/assets?labelId=${reference.testCollection.lvl1Label}`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(reference.testCollection.lvl1LabelAssetIds.length)
          for(const asset of res.body){
            expect(asset.assetId).to.be.oneOf(reference.testCollection.lvl1LabelAssetIds)
            expect(asset.collectionId, "expect collectionId to be equal to reference.testCollection.collectionId").to.be.eql(reference.testCollection.collectionId)
            for(const label of asset.assetLabelIds){
              expect(label).to.be.oneOf(reference.testCollection.labels, `Label should be one of the valid labels`)
            }      
            if(asset.access === "r"){
              expect(iteration.name).to.be.oneOf(['lvl1'])
            }
            else {
              expect(asset.access).to.be.oneOf(['rw'])
            }      
          }
       
        })
        it(`Assets in a Collection attached to a STIG - labelId`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}/assets?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)

          if(!distinct.hasAccessToTestAsset){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)
          expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableFullLabel.length)

          for(let asset of res.body){
            expect(asset.assetId, "expect assetId to be an asset attached to this bnenchmark").to.be.oneOf(distinct.assetsAvailableBenchmark)
            expect(asset.collectionId, "expect collectionId to be equal to reference.testCollection.collectionId").to.be.eql(reference.testCollection.collectionId)
            for(const label of asset.assetLabelIds){
              expect(label).to.be.oneOf(reference.testCollection.labels, `Label should be one of the valid labels`)
            }     
            if(asset.access === "r"){
              expect(iteration.name).to.be.oneOf(['lvl1'])
            }
            else {
              expect(asset.access).to.be.oneOf(['rw'])
            }       
          }   
        })
        it(`Assets in a Collection attached to a STIG - labelName`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}/assets?labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
            if(!distinct.hasAccessToTestAsset){
              expect(res.status).to.eql(403)
              return
            }
  
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an(`array`).of.length(distinct.assetsAvailableFullLabel.length)
  
            for(let asset of res.body){
              expect(asset.assetId, "expect assetId to be an asset attached to this bnenchmark").to.be.oneOf(distinct.assetsAvailableBenchmark)
              expect(asset.collectionId, "expect collectionId to be equal to reference.testCollection.collectionId").to.be.eql(reference.testCollection.collectionId)
              for(const label of asset.assetLabelIds){
                expect(label).to.be.oneOf(reference.testCollection.labels, `Label should be one of the valid labels`)
              }   
              if(asset.access === "r"){
                expect(iteration.name).to.be.oneOf(['lvl1'])
              }
              else {
                expect(asset.access).to.be.oneOf(['rw'])
              }         
            }   
        })
        it(`Assets in a Collection attached to a STIG - label match = null`, async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}/assets?labelMatch=null`, 'GET', iteration.token)
            if(!distinct.hasAccessToTestAsset){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200) 
            expect(res.body).to.be.an(`array`).of.length(1)
            for(let asset of res.body){
              expect(asset.assetLabelIds).to.be.empty
              expect(asset.collectionId).to.eql(reference.testCollection.collectionId)
              if(asset.access === "r"){
                expect(iteration.name).to.be.oneOf(['lvl1'])
              }
              else {
                expect(asset.access).to.be.oneOf(['rw'])
              }
            }
           
        })
      })
    })
  }
})


import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip';
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {requestBodies} from "./requestBodies.js"
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { reviewsFromCkl, reviewsFromScc, reviewsFromCklb } from "@nuwcdivnpt/stig-manager-client-modules"
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)


describe('POST - Collection - not all tests run for all iterations', function () {

  before(async function () {
    await utils.loadAppData()
    await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
  })

  for(const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`,async function () {})
      continue
    }
    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
      
      before(async function () {
        await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
      })

      after(async function () {
     //   await utils.deleteStigByRevision("VPN_SRG_TEST", "V1R0")
      })
  
      describe("createCollection - /collections", function () {

        const random = utils.getUUIDSubString()

        it("Create a Collection and test projections",async function () {
          const post = JSON.parse(JSON.stringify(requestBodies.createCollection))
          post.name = "testCollection" + random
          const res = await utils.executeRequest(`${config.baseUrl}/collections?elevate=${distinct.canElevate}&projection=grants&projection=labels&projection=assets&projection=owners&projection=statistics&projection=stigs`, 'POST', iteration.token, post)
          if(distinct.canCreateCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)
          if (distinct.grant === 'none') {  
            // grant = none iteration can create a collection, but does not give itself access to the collection
            // TODO: Should eventually be changed to respond with empty object
            return
          }
          expect(res.body.description).to.equal("Collection TEST description")
          expect(res.body.name).to.equal(post.name)
          expect(res.body.settings.fields.detail.enabled).to.equal(post.settings.fields.detail.enabled)
          expect(res.body.settings.fields.detail.required).to.equal(post.settings.fields.detail.required)
          expect(res.body.settings.fields.comment.enabled).to.equal(post.settings.fields.comment.enabled)
          expect(res.body.settings.fields.comment.required).to.equal(post.settings.fields.comment.required)
          expect(res.body.settings.status.canAccept).to.equal(post.settings.status.canAccept)
          expect(res.body.settings.status.minAcceptGrant).to.equal(post.settings.status.minAcceptGrant)
          expect(res.body.settings.status.resetCriteria).to.equal(post.settings.status.resetCriteria)
          expect(res.body.settings.history.maxReviews).to.equal(post.settings.history.maxReviews)

          expect(res.body.settings.importOptions).to.deep.equalInAnyOrder(reference.defaultImportOptions)

          expect(res.body.metadata.pocName).to.equal(post.metadata.pocName)
          expect(res.body.metadata.pocEmail).to.equal(post.metadata.pocEmail)
          expect(res.body.metadata.pocPhone).to.equal(post.metadata.pocPhone)
          expect(res.body.metadata.reqRar).to.equal(post.metadata.reqRar)


          // grants projection
          expect(res.body.grants).to.have.lengthOf(1)
          expect(res.body.grants[0].user.userId).to.equal("1")
          expect(res.body.grants[0].roleId).to.equal(4)
          expect(res.body.grants[0].grantId).to.exist

          // labels projection
          expect(res.body.labels).to.have.lengthOf(1)
          expect(res.body.labels[0].name).to.equal("TEST")
          expect(res.body.labels[0].description).to.equal("Collection label description")
          expect(res.body.labels[0].color).to.equal("ffffff")

          // assets projection
          expect(res.body.assets).to.have.lengthOf(0)

          // owners projection
          expect(res.body.owners).to.have.lengthOf(1)
          expect(res.body.owners[0].userId).to.equal("1")

          // statistics projection
          expect(res.body.statistics.assetCount).to.equal(0)
          expect(res.body.statistics.checklistCount).to.equal(0)
      
          // stigs projection
          expect(res.body.stigs).to.have.lengthOf(0)

          // just an extra check to make sure the collection was created
          const createdCollection = await utils.getCollection(res.body.collectionId)
            expect(createdCollection).to.exist
        })

        it("Create a Collection with no settings, expect the default",async function () {
          const defaultSettings = {
            fields: {
              detail: {
                enabled: 'always',
                required: 'always'
              },
              comment: {
                enabled: 'findings',
                required: 'findings'
              }
            },
            status: {
              canAccept: true,
              resetCriteria: 'result',
              minAcceptGrant: 3
            },
            history: {
              maxReviews: 5
            },
            importOptions:{
              autoStatus: {
                fail: "saved",
                notapplicable: "saved",
                pass: "saved",
              },
              unreviewed: 'commented',
              unreviewedCommented: 'informational',
              emptyDetail: 'replace',
              emptyComment: 'ignore',
              allowCustom: true
            }
          }
          const post = JSON.parse(JSON.stringify(requestBodies.collectionWithNoSettings))
          post.name = post.name + random
          const res = await utils.executeRequest(`${config.baseUrl}/collections?elevate=${distinct.canElevate}&projection=grants&projection=labels&projection=assets&projection=owners&projection=statistics&projection=stigs`, 'POST', iteration.token, post)
          if(distinct.canCreateCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)
          if (distinct.grant === 'none') {  
            // grant = none iteration can create a collection, but does not give itself access to the collection
            // TODO: Should eventually be changed to respond with empty object
            return
          }
          expect(res.body.name).to.equal(post.name)
          expect(res.body.settings).to.deep.equalInAnyOrder(defaultSettings)

        })


        it("Create a Collection with partial settings, expect the defaults for the rest",async function () {
          const defaultSettings = {
            fields: {
              detail: {
                enabled: 'always',
                required: 'always'
              },
              comment: {
                enabled: 'findings',
                required: 'findings'
              }
            },
            status: {
              canAccept: true,
              resetCriteria: 'result',
              minAcceptGrant: 3
            },
            history: {
              maxReviews: 5
            },
            importOptions:{
              autoStatus: {
                fail: "saved",
                notapplicable: "saved",
                pass: "saved",
              },
              unreviewed: 'commented',
              unreviewedCommented: 'informational',
              emptyDetail: 'replace',
              emptyComment: 'ignore',
              allowCustom: true
            }
          }

          
          const post = JSON.parse(JSON.stringify(requestBodies.collectionWithNoSettings))
          post.name = post.name + utils.getUUIDSubString()
          post.settings = {
            history: {
              maxReviews: 10
            },
          }
          const res = await utils.executeRequest(`${config.baseUrl}/collections?elevate=${distinct.canElevate}&projection=grants&projection=labels&projection=assets&projection=owners&projection=statistics&projection=stigs`, 'POST', iteration.token, post)
          if(distinct.canCreateCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)
          if (distinct.grant === 'none') {  
            // grant = none iteration can create a collection, but does not give itself access to the collection
            // TODO: Should eventually be changed to respond with empty object
            return
          }
          expect(res.body.name).to.equal(post.name)
          expect(res.body.settings.fields).to.deep.equalInAnyOrder(defaultSettings.fields)
          expect(res.body.settings.status).to.deep.equalInAnyOrder(defaultSettings.status)
          expect(res.body.settings.history).to.deep.equalInAnyOrder(post.settings.history)
          expect(res.body.settings.importOptions).to.deep.equalInAnyOrder(defaultSettings.importOptions)


        })
        it("Create A colleciton with grant to a user group",async function () {

          const post = requestBodies.createCollectionWithTestGroup
          let uuid = uuidv4().slice(0, 10)
          post.name = "testCollection" + uuid
          const res = await utils.executeRequest(`${config.baseUrl}/collections?elevate=${distinct.canElevate}&projection=grants`, 'POST', iteration.token, post)
          if(distinct.canCreateCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(201)
          expect(res.body.grants).to.have.lengthOf(1)
          expect(res.body.grants[0].userGroup.userGroupId).to.equal("1")
          expect(res.body.grants[0].roleId).to.equal(2)
        })
        it("should throw SmError.UnprocessableError due to duplicate user in grant array.",async function () {

          const post = JSON.parse(JSON.stringify(requestBodies.createCollection))
          post.grants.push(post.grants[0])
          post.name = "TEST" + utils.getUUIDSubString()
          const res = await utils.executeRequest(`${config.baseUrl}/collections?elevate=${distinct.canElevate}`, 'POST', iteration.token, post)
            if(distinct.canCreateCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(422)
            expect(res.body.error).to.equal("Unprocessable Entity.")
            expect(res.body.detail).to.equal("Duplicate user or user group in grant array")
        })
        it("should throw SmError.UnprocessableError due to duplicate name exists ",async function () {
          const post = JSON.parse(JSON.stringify(requestBodies.createCollection))
          post.name = "testCollection" + random
          const res = await utils.executeRequest(`${config.baseUrl}/collections?elevate=${distinct.canElevate}&projection=grants&projection=labels&projection=assets&projection=owners&projection=statistics&projection=stigs`, 'POST', iteration.token, post)
          if(distinct.canCreateCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          if (distinct.grant === 'none') {  
            // grant = none iteration can create a collection, but does not give itself access to the collection
            // TODO: Should eventually be changed to respond with empty object
            return
          }
          expect(res.status).to.eql(422)
          expect(res.body.error).to.equal("Unprocessable Entity.")
          expect(res.body.detail).to.equal("Duplicate name exists.")
        })
      })

      describe("postCklArchiveByCollection - /collections/{collectionId}/archive/ckl", function () {

        it("should download a CKL and get the test asset with test benchmark ",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/ckl`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveBenchmarkRevision,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          // Fetch request
          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)

          const resArrayBuffer = await res.arrayBuffer();
          const resBuffer = Buffer.from(resArrayBuffer);

        
          const zip = await JSZip.loadAsync(resBuffer)
          const fileNames = Object.keys(zip.files)
          expect(fileNames).to.have.lengthOf(2)
          const data = await zip.files["Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.ckl"].async("string")
          const assetData = reviewsFromCkl({
            data,                    
            fieldSettings: config.fieldSettings,  
            allowAccept: true,       
            importOptions: config.importOptions, 
            sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.ckl"
          })
          expect(assetData.target.name).to.equal(reference.testAsset.name)
          expect(assetData.target.metadata.cklRole).to.exist
          expect(assetData.target.metadata.cklRole).to.equal("None")
          expect(assetData.checklists).to.have.lengthOf(1)
          expect(assetData.checklists[0].benchmarkId).to.equal(reference.benchmark)
          expect(assetData.checklists[0].revisionStr).to.equal("V1R1")
          expect(assetData.checklists[0].reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
        })

        it("should download a CKL for an asset that does not have stigs attached, should throw. Lvl1 and collection creator do not  have access to asset",async function () {

        
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/ckl`, 'POST', iteration.token, requestBodies.postArchiveBenchmarkRevisionLvl1NoAccess)

          if(iteration.name ==  "lvl1" || iteration.name == "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
        })

        it("should download a CKL and get the test asset with test benchmark and no revision specified. should return latest",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/ckl`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveBenchmark,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          // Fetch request
          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)

          const resArrayBuffer = await res.arrayBuffer();
          const resBuffer = Buffer.from(resArrayBuffer);

        
          const zip = await JSZip.loadAsync(resBuffer)
            const fileNames = Object.keys(zip.files)
            expect(fileNames).to.have.lengthOf(2)
            const data = await zip.files["Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.ckl"].async("string")
            const assetData = reviewsFromCkl({
              data,                    
              fieldSettings: config.fieldSettings,  
              allowAccept: true,       
              importOptions: config.importOptions, 
              sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.ckl"
            })
            expect(assetData.target.name).to.equal(reference.testAsset.name)
            expect(assetData.target.metadata.cklRole).to.exist
            expect(assetData.target.metadata.cklRole).to.equal("None")
            expect(assetData.checklists).to.have.lengthOf(1)
            expect(assetData.checklists[0].benchmarkId).to.equal(reference.benchmark)
            expect(assetData.checklists[0].revisionStr).to.equal("V1R1")
            expect(assetData.checklists[0].reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
        })
        it("should download a CKL and get the test asset with all benchmarks in a multi stig CKL file ",async function () {

          const url =`${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/ckl?mode=multi`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveDefault,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          // Fetch request
          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)

          const resArrayBuffer = await res.arrayBuffer();
          const resBuffer = Buffer.from(resArrayBuffer);

        
          const zip = await JSZip.loadAsync(resBuffer)
            const fileNames = Object.keys(zip.files)
            expect(fileNames).to.have.lengthOf(2)
            const data = await zip.files["Collection_X_lvl1_asset-1.ckl"].async("string")
            const assetData = reviewsFromCkl({
              data,                    
              fieldSettings: config.fieldSettings,  
              allowAccept: true,       
              importOptions: config.importOptions, 
              sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.ckl"
            })
            expect(assetData.target.name).to.equal(reference.testAsset.name)
            expect(assetData.target.metadata.cklRole).to.exist
            expect(assetData.target.metadata.cklRole).to.equal("None")
            expect(assetData.checklists).to.have.lengthOf(distinct.testAssetChecklists)
            for(const checklist of assetData.checklists){
              if(checklist.benchmarkId === reference.benchmark){
                expect(checklist.revisionStr).to.equal("V1R1")
                expect(checklist.reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
              }
              else {
                expect(checklist.benchmarkId).to.equal(reference.windowsBenchmark)
                expect(checklist.revisionStr).to.equal("V1R23")
                expect(checklist.reviews).to.have.lengthOf(3)
              }
            }
        })
      })

      describe("postCklbArchiveByCollection - /collections/{collectionId}/archive/cklb", function () {

        it("should download a CKLB and get the test asset with test benchmark ",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/cklb`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveBenchmarkRevision,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)

          const resArrayBuffer = await res.arrayBuffer()
          const resBuffer = Buffer.from(resArrayBuffer)
          const zip = await JSZip.loadAsync(resBuffer)
          const fileNames = Object.keys(zip.files)
          expect(fileNames).to.have.lengthOf(2)
          const data = await zip.files["Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.cklb"].async("string")
          const assetData = reviewsFromCklb({
            data,                    
            fieldSettings: config.fieldSettings,  
            allowAccept: true,       
            importOptions: config.importOptions, 
            sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.cklb"
          })
          expect(assetData.target.name).to.equal(reference.testAsset.name)
          expect(assetData.target.metadata.cklRole).to.exist
          expect(assetData.target.metadata.cklRole).to.equal("None")
          expect(assetData.checklists).to.have.lengthOf(1)
          expect(assetData.checklists[0].benchmarkId).to.equal(reference.benchmark)
        //   expect(assetData.checklists[0].revisionStr).to.equal("V1R1") need new stigmancliet modules 
          expect(assetData.checklists[0].reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
        })

        it("should download a CKLB for an asset that does not have stigs attached, should throw. Lvl1 and collection creator do not  have access to asset",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/cklb`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveBenchmarkRevisionLvl1NoAccess,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          const res = await fetch(url, options)

          if(iteration.name ==  "lvl1" || iteration.name == "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
        })

        it("should download a CKLB and get the test asset with test benchmark and no revision specified. should return latest",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/cklb`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveBenchmark,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          //expect(res.status).to.eql(200)
          expect(res.status).to.eql(200)
          const resArrayBuffer = await res.arrayBuffer()
          const resBuffer = Buffer.from(resArrayBuffer)
          const zip = await JSZip.loadAsync(resBuffer)
            const fileNames = Object.keys(zip.files)
            expect(fileNames).to.have.lengthOf(2)
            const data = await zip.files["Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.cklb"].async("string")
            const assetData = reviewsFromCklb({
              data,                    
              fieldSettings: config.fieldSettings,  
              allowAccept: true,       
              importOptions: config.importOptions, 
              sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.cklb"
            })
            expect(assetData.target.name).to.equal(reference.testAsset.name)
            expect(assetData.target.metadata.cklRole).to.exist
            expect(assetData.target.metadata.cklRole).to.equal("None")
            expect(assetData.checklists).to.have.lengthOf(1)
            expect(assetData.checklists[0].benchmarkId).to.equal(reference.benchmark)
        //    expect(assetData.checklists[0].revisionStr).to.equal("V1R1")
            expect(assetData.checklists[0].reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
        })
        it("should download a CKLB and get the test asset with all benchmarks in a multi stig CKLB file ",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/cklb?mode=multi`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveDefault,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)
          const resArrayBuffer = await res.arrayBuffer()
          const resBuffer = Buffer.from(resArrayBuffer)
          const zip = await JSZip.loadAsync(resBuffer)
          const fileNames = Object.keys(zip.files)
          expect(fileNames).to.have.lengthOf(2)
          const data = await zip.files["Collection_X_lvl1_asset-1.cklb"].async("string")
          const assetData = reviewsFromCklb({
            data,                    
            fieldSettings: config.fieldSettings,  
            allowAccept: true,       
            importOptions: config.importOptions, 
            sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1.cklb"
          })
          expect(assetData.target.name).to.equal(reference.testAsset.name)
          expect(assetData.target.metadata.cklRole).to.exist
          expect(assetData.target.metadata.cklRole).to.equal("None")
          expect(assetData.checklists).to.have.lengthOf(distinct.testAssetChecklists)
          for(const checklist of assetData.checklists){
            if(checklist.benchmarkId === reference.benchmark){
            //   expect(checklist.revisionStr).to.equal("V1R1")
              expect(checklist.reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
            }
            else {
              expect(checklist.benchmarkId).to.equal(reference.windowsBenchmark)
          //     expect(checklist.revisionStr).to.equal("V1R23")
              expect(checklist.reviews).to.have.lengthOf(3)
            }
          }
        })
      })

      describe("postXccdfArchiveByCollection - /collections/{collectionId}/archive/xccdf", function () {

        const dataArray = [
          {
            scapBenchmarkId: 'CAN_Ubuntu_18-04_STIG',
            benchmarkId: 'U_CAN_Ubuntu_18-04_STIG'
          },
          { scapBenchmarkId: 'Mozilla_Firefox_RHEL', benchmarkId: 'Mozilla_Firefox' },
          {
            scapBenchmarkId: 'Mozilla_Firefox_Windows',
            benchmarkId: 'Mozilla_Firefox'
          },
          { scapBenchmarkId: 'MOZ_Firefox_Linux', benchmarkId: 'MOZ_Firefox_STIG' },
          { scapBenchmarkId: 'MOZ_Firefox_Windows', benchmarkId: 'MOZ_Firefox_STIG' },
          { scapBenchmarkId: 'Solaris_10_X86_STIG', benchmarkId: 'Solaris_10_X86' }
        ]
        
        const scapBenchmarkMap = new Map(
          dataArray.map(item => [item.scapBenchmarkId, item])
        )

        it("should download a xccdf and get the test asset with test benchmark ",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/xccdf`
          const requestBody = JSON.stringify(
            requestBodies.postArchiveBenchmarkRevision,
          )
      
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
      
          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)
          const resArrayBuffer = await res.arrayBuffer()
          const resBuffer = Buffer.from(resArrayBuffer)
          const zip = await JSZip.loadAsync(resBuffer)
          const fileNames = Object.keys(zip.files)
          expect(fileNames).to.have.lengthOf(2)
          const data = await zip.files["Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1-xccdf.xml"].async("string")
          const assetData = reviewsFromScc({
            data,                    
            fieldSettings: config.fieldSettings,  
            allowAccept: true,       
            importOptions: config.importOptions, 
            sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1-xccdf.xml"
          })
          expect(assetData.target.name).to.equal(reference.testAsset.name)
          expect(assetData.target.metadata.testkey).to.exist
          expect(assetData.target.metadata.testkey).to.equal("testvalue")
          expect(assetData.checklists).to.have.lengthOf(1)
          expect(assetData.checklists[0].benchmarkId).to.equal(reference.benchmark)
        //   expect(assetData.checklists[0].revisionStr).to.equal("V1R1")
          expect(assetData.checklists[0].reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
        })

        it("should download a xccdf for an asset that does not have stigs attached, should throw. Lvl1 and collection creator do not  have access to asset",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/xccdf`, 'POST', iteration.token, requestBodies.postArchiveBenchmarkRevisionLvl1NoAccess)

          if(iteration.name ==  "lvl1" || iteration.name == "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(422)
        })

        it("should download a xccdf and get the test asset with test benchmark and no revision specified. should return latest",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/xccdf`

          const requestBody = JSON.stringify(
            requestBodies.postArchiveBenchmark,
          )

          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }

          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)
          const resArrayBuffer = await res.arrayBuffer()
          const resBuffer = Buffer.from(resArrayBuffer)
          const zip = await JSZip.loadAsync(resBuffer)
          const fileNames = Object.keys(zip.files)
          expect(fileNames).to.have.lengthOf(2)
          const data = await zip.files["Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1-xccdf.xml"].async("string")
          const assetData = reviewsFromScc({
            data,                    
            fieldSettings: config.fieldSettings,  
            allowAccept: true,       
            importOptions: config.importOptions, 
            sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1-xccdf.xml"
          })
          expect(assetData.target.name).to.equal(reference.testAsset.name)
          expect(assetData.target.metadata.testkey).to.exist
          expect(assetData.target.metadata.testkey).to.equal("testvalue")
          expect(assetData.checklists).to.have.lengthOf(1)
          expect(assetData.checklists[0].benchmarkId).to.equal(reference.benchmark)
      //    expect(assetData.checklists[0].revisionStr).to.equal("V1R1")
          expect(assetData.checklists[0].reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
        })

        it("should download a xccdf and get the test asset with all benchmarks in a multi stig xccdf file ",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/archive/xccdf`

          const requestBody = JSON.stringify(
            requestBodies.postArchiveDefault,
          )

          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }

          const res = await fetch(url, options)

          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)
          const resArrayBuffer = await res.arrayBuffer()
          const resBuffer = Buffer.from(resArrayBuffer)
          const zip = await JSZip.loadAsync(resBuffer)
          const fileNames = Object.keys(zip.files)
          if(iteration.name === "lvl1"){
            expect(fileNames).to.have.lengthOf(2)
          }
          else {
            expect(fileNames).to.have.lengthOf(3)
          }
          
          const dataVPN = await zip.files["Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1-xccdf.xml"].async("string")
            
          const assetDataVPN = reviewsFromScc({
            data: dataVPN,                    
            fieldSettings: config.fieldSettings,  
            allowAccept: true,       
            importOptions: config.importOptions, 
            sourceRef: "Collection_X_lvl1_asset-1-VPN_SRG_TEST-V1R1-xccdf.xml",
            scapBenchmarkMap
          })
          expect(assetDataVPN.target.name).to.equal(reference.testAsset.name)
          expect(assetDataVPN.target.metadata.testkey).to.exist
          expect(assetDataVPN.target.metadata.testkey).to.equal("testvalue")
          expect(assetDataVPN.checklists).to.have.lengthOf(1)
          for(const checklist of assetDataVPN.checklists){
            //expect(checklist.revisionStr).to.equal("V1R1")
            expect(checklist.reviews).to.have.lengthOf(reference.testAsset.VPN_SRG_TEST_reviewCnt)
          }

          if(iteration.name === "lvl1"){
            return
          }
          const dataWindows = await zip.files["Collection_X_lvl1_asset-1-Windows_10_STIG_TEST-V1R23-xccdf.xml"].async("string")
          const assetDataWindows = reviewsFromScc({
            data: dataWindows,
            fieldSettings: config.fieldSettings,
            allowAccept: true,
            importOptions: config.importOptions,
            sourceRef: "Collection_X_lvl1_asset-1-Windows_10_STIG_TEST-V1R23-xccdf.xml",
            scapBenchmarkMap
          })
          expect(assetDataWindows.target.name).to.equal(reference.testAsset.name)
          expect(assetDataWindows.target.metadata.testkey).to.exist
          expect(assetDataWindows.target.metadata.testkey).to.equal("testvalue")
          expect(assetDataWindows.checklists).to.have.lengthOf(1)
          for(const checklist of assetDataWindows.checklists){
              expect(checklist.benchmarkId).to.equal(reference.windowsBenchmark)
              //expect(checklist.revisionStr).to.equal("V1R23")
              expect(checklist.reviews).to.have.lengthOf(3)
            }
        })
      })

      describe("cloneCollection - /collections/{collectionId}/clone - test basic clone permissions (ie. must have owner grant + createCollection priv", function () {

        // this is flakey should be redesigned.
        before(async function () {
          await utils.setDefaultRevision(reference.testCollection.collectionId, reference.benchmark, reference.testCollection.pinRevision)
        })

        let clonedCollection = null

        it("Clone test collection and check that cloned collection matches source ",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/clone?projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs&projection=labels&projection=users`

          const requestBody = JSON.stringify({
            name:"Clone_" + utils.getUUIDSubString() + "_X",
            description: "clone of test collection x",
            options: {
              grants: true,
              labels: true,
              assets: true,
              stigMappings: "withReviews",
              pinRevisions: "matchSource",
            },
          })

          const options = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${iteration.token}`,
                "Content-Type": "application/json",
            },
            body: requestBody,
          }

          const res = await fetch(url, options)
          let clonedCollectionId = null
          if(!(distinct.canCreateCollection && distinct.canModifyCollection)){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          const responseText = await res.text();
          const response = responseText.split("\n");
          expect(response).to.be.an('array')
          for(const message of response){ 
              if(message.length > 0){
                  let messageObj = JSON.parse(message)
                  if(messageObj.stage == "result"){
                      clonedCollectionId = messageObj.collection.collectionId
                      clonedCollection = messageObj.collection.collectionId
                      // assets 
                      expect(messageObj.collection.assets).to.have.lengthOf(reference.testCollection.assetsProjected.length)
                      expect(message.grants).to.equal(message.users)

                      for(const asset of messageObj.collection.assets){
                        expect(asset.name).to.be.oneOf(reference.testCollection.assetsProjected.map(a => a.name))
                      }
                      // remove grantId from grants response and grantsProjected expected response ( this cannot be tested well q)
                      let grantsProjectedResponse = []
                      for (const grant of messageObj.collection.grants){
                          let {grantId, ...grantCheckProps} = grant
                          grantsProjectedResponse.push(grantCheckProps)
                      }

                      let expectedGrantsResponse = []
                      for (let grant of reference.testCollection.grantsProjected){
                          let {grantId, ...grantCheckProps} = grant
                          expectedGrantsResponse.push(grantCheckProps)
                      }
                      expect(grantsProjectedResponse, "check cloned collection grants").to.eql(expectedGrantsResponse)

                      // owners
                      expect(messageObj.collection.owners).to.have.same.deep.members(reference.testCollection.ownersProjected)
                      // statistics
                      expect(messageObj.collection.statistics.assetCount).to.eql(reference.testCollection.statisticsProjected.assetCount);
                      expect(messageObj.collection.statistics.checklistCount).to.eql(reference.testCollection.statisticsProjected.checklistCount);
                      // // stigs 
                      expect(messageObj.collection.stigs).to.deep.equalInAnyOrder(reference.testCollection.stigsProjected)
                      // labels
                      expect(messageObj.collection.labels).to.have.lengthOf(reference.testCollection.labelsProjected.length)
                      for(const label of messageObj.collection.labels){
                          expect(label.name).to.be.oneOf(reference.testCollection.labelsProjected.map(l => l.name))
                      }

                      expect(messageObj.collection.settings.importOptions).to.deep.equalInAnyOrder(reference.testCollection.importOptions)

                      // confirm that ACLs have been transfered. will check with the testGroup acl in new collection 
                      const testGroupGrantId = messageObj.collection.grants.find(g => g.userGroup?.userGroupId === reference.testCollection.testGroup.userGroupId).grantId

                      const acl = await utils.executeRequest(`${config.baseUrl}/collections/${clonedCollection}/grants/${testGroupGrantId}/acl`, 'GET', iteration.token)
                      expect(acl.status).to.eql(200)
                      expect(acl.body.acl).to.have.lengthOf(3)
                  }
              }
            }
            
            if(clonedCollectionId !== null){
            // check reviews are there.
            const clonedCollectionReviews = await utils.getReviews(clonedCollectionId)
            const sourceCollectionReviews = await utils.getReviews(reference.testCollection.collectionId)
            expect(clonedCollectionReviews).to.exist
            expect(sourceCollectionReviews).to.exist
            expect(clonedCollectionReviews).to.be.an('array').of.length(sourceCollectionReviews.length)
            const reviewRegex = "test"
            const assetRegex = "asset"

            for(const review of clonedCollectionReviews){
                expect(review.detail).to.match(new RegExp(reviewRegex))
                expect(review.assetName).to.match(new RegExp(assetRegex))
            }

            // compare the cloned collection with the source collection should be the same
            const clonedCollection = await utils.getCollection(clonedCollectionId)
            const sourceCollection = await utils.getCollection(reference.testCollection.collectionId)
            expect(sourceCollection).to.exist
            expect(clonedCollection).to.exist 

            for(const asset of clonedCollection.assets){
                expect(asset.name).to.be.oneOf(sourceCollection.assets.map(a => a.name))
            }
            expect(clonedCollection.assets).to.have.lengthOf(sourceCollection.assets.length)
            expect(clonedCollection.grants).to.have.lengthOf(sourceCollection.grants.length)
            expect(clonedCollection.labels).to.have.lengthOf(sourceCollection.labels.length)
            expect(clonedCollection.owners).to.have.lengthOf(sourceCollection.owners.length)

            const sourceMetricsResponse = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail`, 'GET', iteration.token)
            expect(sourceMetricsResponse.status).to.eql(200)
            const clonedMetricsResponse = await utils.executeRequest(`${config.baseUrl}/collections/${clonedCollectionId}/metrics/detail`, 'GET', iteration.token)
            expect(clonedMetricsResponse.status).to.eql(200)
            
            // Normalize metrics responses by removing assetId, labelIds, and timestamp fields that are expected to differ
            const normalizeMetrics = (metricsArray) => {
              return metricsArray.map(item => {
                const normalized = { ...item }
                delete normalized.assetId
                
                // Remove labelId from labels array
                if (normalized.labels && Array.isArray(normalized.labels)) {
                  normalized.labels = normalized.labels.map(label => {
                    const { labelId, ...labelWithoutId } = label
                    return labelWithoutId
                  })
                }
                
                // Remove timestamp fields from metrics
                if (normalized.metrics) {
                  const { maxTs, minTs, maxTouchTs, ...metricsWithoutTs } = normalized.metrics
                  normalized.metrics = metricsWithoutTs
                }
                
                return normalized
              })
            }
            
            const normalizedSource = normalizeMetrics(sourceMetricsResponse.body)
            const normalizedCloned = normalizeMetrics(clonedMetricsResponse.body)
            expect(normalizedSource).to.deep.equalInAnyOrder(normalizedCloned)

          }
        })
      })

      describe("exportToCollection - /collections/{collectionId}/export-to/{dstCollectionId}", function () {

        before(async function () {
          await utils.loadAppData()
          await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
        })
        
        it("export entire asset to another collection, should create asset in destination",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/export-to/${reference.scrapCollection.collectionId}`

          const requestBody = JSON.stringify([
            {
              assetId: reference.testAsset.assetId,
            },
          ])

          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }

          const res = await fetch(url, options)
            
          if(distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          const responseText = await res.text()
          const response = responseText.split("\n")
          expect(response).to.be.an('array')
          expect(response).to.have.lengthOf.at.least(1)

          for(const message of response){ 
            if(message.length > 0){
              let messageObj = JSON.parse(message)
              if(messageObj.stage == "result"){
                expect(messageObj.counts.assetsCreated).to.eql(1)
                expect(messageObj.counts.stigsMapped).to.eql(reference.testAsset.validStigs.length)
                expect(messageObj.counts.reviewsInserted).to.eql(reference.testAsset.reviewCnt)
                expect(messageObj.counts.reviewsUpdated).to.eql(0)
              }
            }
          }
        })

        it("export entire asset to another collection, asset already exists so we will be updating reviews",async function () {

          const url = `${config.baseUrl}/collections/${reference.testCollection.collectionId}/export-to/${reference.scrapCollection.collectionId}`

          const requestBody = JSON.stringify([
            {
              assetId: reference.testAsset.assetId,
            },
          ])

          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${iteration.token}`,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }

          const res = await fetch(url, options)

          if(distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }

          expect(res.status).to.eql(200)
          const responseText = await res.text()
          const response = responseText.split("\n")
          expect(response).to.be.an('array')
          expect(response).to.have.lengthOf.at.least(1)
          for(const message of response){ 
              if(message.length > 0){
                  let messageObj = JSON.parse(message)
                  if(messageObj.stage == "result"){
                    expect(messageObj.counts.assetsCreated).to.eql(0)
                    expect(messageObj.counts.stigsMapped).to.eql(0)
                    expect(messageObj.counts.reviewsInserted).to.eql(0)
                    expect(messageObj.counts.reviewsUpdated).to.eql(9)
                  }
              }
          }
        })
      })

      describe("createCollectionLabel - /collections/{collectionId}/labels", function () {

        let label = null

        it("Create Label in a Collection",async function () {

          const request = {
              "name": "test-label-POST",
              "description": "test label POSTED",
              "color": "aa34cc"
            }
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/labels`, 'POST', iteration.token, request)

            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            label = res.body
            expect(res.status).to.eql(201)
            expect(res.body.name).to.equal(request.name)
            expect(res.body.description).to.equal(request.description)
            expect(res.body.color).to.equal(request.color)
            expect(res.body.uses).to.equal(0)
        })
        it("Clean up - delete label",async function () {
            if(label){
              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/labels/${label.labelId}`, 'DELETE', iteration.token)
                expect(res.status).to.eql(204)
            }
        })
      })

      describe("createCollectionLabels - /collections/{collectionId}/labels/batch", function () {

        let labels = null

        it("Create Label in a Collection",async function () {

          const request = [
            {
              "color": "aa33cc",
              "description": "label-POST-1",
              "name": "label-POST-1"
            },
            {
              "color": "aa34cc",
              "description": "label-POST-2",
              "name": "label-POST-2"
            },
            {
              "color": "aa35cc",
              "description": "label-POST-3",
              "name": "label-POST-3"
            }
          ]
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/labels/batch`, 'POST', iteration.token, request)

          if(distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          labels = res.body
          expect(res.status).to.eql(201)
          expect(res.body).to.be.an('array').of.length(3)

          for(const label of res.body){
            expect(label.name).to.be.oneOf(request.map(l => l.name))
            expect(label.description).to.be.oneOf(request.map(l => l.description))
            expect(label.color).to.be.oneOf(request.map(l => l.color))
            expect(label.uses).to.equal(0)
          }
  
        })
        it("Clean up - delete labels",async function () {
            if(labels){
              for(const label of labels){
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/labels/${label.labelId}`, 'DELETE', iteration.token)
                expect(res.status).to.eql(204)
              }
            }
        })

        it("should throw error, post must be array of length one.", async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/labels/batch`, 'POST', iteration.token, [])
          expect(res.status).to.eql(400)

        })
      })

      describe("writeStigPropsByCollectionStig - /collections/{collectionId}/stigs/{benchmarkId}", function () {
        before(async function () {
          await utils.loadAppData()
          await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
        })

        it("Set revision v1r1 of test benchmark to assets",async function () {

          const post =
          {
            defaultRevisionStr: "V1R1",
            assetIds: ["62", "42", "154"],
          }

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`, 'POST', iteration.token, post)

            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }

            expect(res.status).to.eql(200)
            expect(res.body.revisionStr).to.eql(requestBodies.writeStigPropsByCollectionStig.defaultRevisionStr)
            expect(res.body.revisionPinned).to.eql(true)
            expect(res.body.ruleCount).to.eql(reference.checklistLength)
            expect(res.body.benchmarkId).to.eql(reference.testCollection.benchmark)
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("Set latest revision of the test benchmark to assets",async function () {

          const post = {
            defaultRevisionStr: "latest",
            assetIds: requestBodies.writeStigPropsByCollectionStig.assetIds,
          }

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`, 'POST', iteration.token, post)

            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }

            expect(res.status).to.eql(200)
            expect(res.body.revisionStr).to.equal(requestBodies.writeStigPropsByCollectionStig.defaultRevisionStr)
            expect(res.body.revisionPinned).to.equal(false)
            expect(res.body.ruleCount).to.eql(reference.checklistLength)
            expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("map list of assets to test benchmark",async function () {

          const post = {
            assetIds: requestBodies.writeStigPropsByCollectionStig.assetIds,
          }

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`, 'POST', iteration.token, post)

            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }

            expect(res.status).to.eql(200)
            expect(res.body.revisionStr).to.equal(requestBodies.writeStigPropsByCollectionStig.defaultRevisionStr)
            expect(res.body.revisionPinned).to.equal(false)
            expect(res.body.ruleCount).to.eql(reference.checklistLength)
            expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("attempt to send invalid revision str, should cause error",async function () {

          const post = {
          defaultRevisionStr: "V1R5"
          }

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`, 'POST', iteration.token, post)

            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }

            expect(res.status).to.eql(422)
        })

        it("Set the default revision string of test benchmark (V1R0)",async function () {

          const post = {
          defaultRevisionStr: reference.testCollection.pinRevision
          }

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`, 'POST', iteration.token, post)

            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }

            expect(res.status).to.eql(200)
            expect(res.body.revisionStr).to.equal(reference.testCollection.pinRevision)
            expect(res.body.revisionPinned).to.equal(true)
            expect(res.body.ruleCount).to.eql(reference.checklistLength)
            expect(res.body.benchmarkId).to.equal(reference.testCollection.benchmark)
            expect(res.body.assetCount).to.eql(requestBodies.writeStigPropsByCollectionStig.assetIds.length)
        })

        it("Set the Assets mapped to a STIG - clear assets",async function () {

          const post = {
          assetIds: []
          }

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.testCollection.benchmark}`, 'POST', iteration.token, post)

            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }

            expect(res.status).to.eql(204)
            expect(res.body).to.eql({})
            
        })
      })

      describe("postGrantsByCollection - /collections/{collectionId}/grants", function () {

        before(async function () {
          await utils.loadAppData()
        })

        it("Add grants to a collection",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/grants?elevate=true`, 'POST', iteration.token, requestBodies.postGrantsByCollection)

            if(iteration.name !== "stigmanadmin"){
              expect(res.status).to.eql(403)
              return
            }

            expect(res.status).to.eql(201)

            expect(res.body).to.have.lengthOf(requestBodies.postGrantsByCollection.length)
            for(const grant of res.body){
              if(grant.user){
                expect(grant.user.userId).to.eql(reference.lvl1User.userId)
                expect(grant.user.username).to.eql(reference.lvl1User.username)
                expect(grant.grantId).to.exist
                expect(grant.roleId).to.equal(2)
              }
              if(grant.userGroup){
                expect(grant.userGroup.userGroupId).to.eql(reference.testCollection.testGroup.userGroupId)
                expect(grant.userGroup.name).to.eql(reference.testCollection.testGroup.name)
                expect(grant.grantId).to.exist
                expect(grant.roleId).to.equal(2)
              }
            }
        })
        it("attempt to create owner grant, elevates should only work for admin user",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/grants?elevate=true`, 'POST', iteration.token, requestBodies.postOwners)

            if(iteration.name !== "stigmanadmin"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(201)
        })
        it("Post Owner grant to collection no elevate",async function () {

          const postGrantsByCollectionOwner = [
            {
              userId: "43",  
              roleId: 4,
            },
          ]

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.scrapCollection.collectionId}/grants`, 'POST', iteration.token, postGrantsByCollectionOwner)

            if(iteration.name !== 'stigmanadmin' && iteration.name !== 'lvl4'){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(201)
            expect(res.body[0].user.userId).to.eql("43")
            expect(res.body[0].roleId).to.equal(4)
        })
      })
    })
  }
})



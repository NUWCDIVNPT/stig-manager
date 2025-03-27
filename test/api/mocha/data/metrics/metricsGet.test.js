import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)
import { dirname } from 'path'
import { fileURLToPath } from 'url'

// import metrics reference file, and set update file path
import metrics from './metricsGet.json' with { type: 'json' }
const metricsUpdateFile = `${dirname(fileURLToPath(import.meta.url))}/metricsGet.json`


describe('GET - Metrics', function () { 
  before(async function () {
    await utils.loadAppData()
  })

  for(const iteration of iterations){
    describe(`iteration:${iteration.name}`, function () {
        
        describe('GET - getMetricsDetailByCollection - /collections/{collectionId}/metrics/detail', function () {

            it('Return detailed metrics for the specified Collection no param', async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail`, 'GET', iteration.token)
            if(iteration.name === "collectioncreator"){
                expect(res.status).to.eql(403)
                return
            }
            expect(res.status).to.eql(200)
            
            // Generates metrics reference file if config.generateMetricsReferenceData=true
            utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
            
            const expectedData = metrics[this.test.title]
          
            if(iteration.name === 'lvl1'){
                expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
            }
            else 
            {
                expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
            }

            })
            it('Return detailed metrics for the specified Collection - with params', async function () {
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail?benchmarkId=${reference.benchmark}&assetId=${reference.testAsset.assetId}&labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)

                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it("test metrics on empty collection", async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${'84'}/metrics/detail`, 'GET', iteration.token)
                if(iteration.name !== "stigmanadmin"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                expect(res.body).to.be.empty

            })
            it("test metrics on collection with labelMatch=null", async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail?labelMatch=null`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }

            })
        })

        describe('GET - getMetricsDetailByCollectionAggAsset - /collections/{collectionId}/metrics/detail/asset', function () {
        
            it('Return detail metrics - assset agg', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/asset`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - asset agg - with param assetId', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/asset?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - asset agg - with params', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/asset?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - asset agg - with params - all', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/asset?benchmarkId=${reference.benchmark}&assetId=${reference.testAsset.assetId}&labelId=${reference.testCollection.fullLabel}&labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - asset agg - with param labelId', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/asset?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - asset agg - with param labelName', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/asset?labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })

        describe('GET - getMetricsDetailByCollectionAgg - /collections/{collectionId}/metrics/detail/collection', function () {

        

            it('Return detail metrics - collection agg - no params', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/collection`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            
            })
            it('Return detail metrics - collection agg - asset param', async function () {

              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/collection?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - collection agg - labelId param', async function () {
            

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/collection?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - collection agg - label name param', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/collection?labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - collection agg - benchmarkId param', async function () {
            
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/collection?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })

        describe('GET - getMetricsDetailByCollectionAggLabel - /collections/{collectionId}/metrics/detail/label', function () {

            it('Return detail metrics - label agg', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/label`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - label agg - param benchmark', async function () {

             
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/label?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - label agg - param assetId', async function () {

            
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/label?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - label agg - param labelId', async function () {


                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/label?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                
            })
            it('Return detail metrics - label agg - param labelName', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/label?labelName=${reference.testCollection.lvl1LabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })

        describe('GET - getMetricsDetailByCollectionAggStig - /collections/{collectionId}/metrics/detail/stig', function () {

            it('Return detail metrics - stig agg', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/stig`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
       
            })
            it('Return detail metrics - stig agg - param benchmark', async function () {

            
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/stig?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - stig agg - param asset', async function () {

            
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/stig?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - stig agg - param labelId', async function () {


                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/stig?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return detail metrics - stig agg - param labelName', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/detail/stig?labelName=${reference.testCollection.lvl1LabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })


        //summary
        describe('GET - getMetricsSummaryByCollection - /collections/{collectionId}/metrics/summary', function () {

        

            it('Return summary metrics for the Collection - no agg - no params', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics for the Collection - benchmark param - no agg', async function () {
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics for the Collection - asset param - no agg', async function () {
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics for the Collection - labelId param - no agg', async function () {
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics for the Collection - labelName param - no agg', async function () {
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary?labelName=${reference.testCollection.lvl1LabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })

        describe('GET - getMetricsSummaryByCollectionAggAsset - /collections/{collectionId}/metrics/summary/asset', function () {

          
            it('Return summary metrics asset agg - summary', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/asset`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - asset agg - with param assetId', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/asset?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - asset agg - with benchmarkID', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/asset?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        
            it('Return summary metrics - asset agg - with param labelId', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/asset?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - asset agg - with param labelName', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/asset?labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })

        describe('GET - getMetricsSummaryByCollectionAgg - /collections/{collectionId}/metrics/summary/collection', function () {

            it('Return summary metrics - collection agg - no params', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/collection`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - collection agg - asset param', async function () {


                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/collection?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - collection agg - labelId param', async function () {
              

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/collection?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - collection agg - label name  param', async function () {
               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/collection?labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })    
            it('Return summary metrics - collection agg - benchmark param', async function () {
              

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/collection?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })

        describe('GET - getMetricsSummaryByCollectionAggLabel - /collections/{collectionId}/metrics/summary/label', function () {


            it('Return summary metrics - label agg', async function () {

               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/label`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                })
            it('Return summary metrics - label agg - param benchmark', async function () {

              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/label?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - label agg - param assetId', async function () {

            
                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/label?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - label agg - param labelId', async function () {

        

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/label?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                   
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }

            })
            it('Return summary metrics - label agg - param labelName', async function () {


                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/label?labelName=${reference.testCollection.lvl1LabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })

        describe('GET - getMetricsSummaryByCollectionAggStig - /collections/{collectionId}/metrics/summary/stig', function () {


            it('Return summary metrics - stig agg', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/stig`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - stig agg - param benchmark', async function () {


                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/stig?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - stig agg - param asset', async function () {


                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/stig?assetId=${reference.testAsset.assetId}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - stig agg - param labelId', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/stig?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
            it('Return summary metrics - stig agg - param labelName', async function () {
                

                const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metrics/summary/stig?labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
                if(iteration.name === "collectioncreator"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                
                // Generates metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metricsUpdateFile)
                
                const expectedData = metrics[this.test.title]

                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
            })
        })
    })
  }
})


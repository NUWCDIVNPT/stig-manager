import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)
import { dirname } from 'path'
import { fileURLToPath } from 'url'

// import metaMetrics reference file, and set update file path
import metaMetrics from './metaMetricsGet.json' with { type: 'json' }
const metaMetricsUpdateFile = `${dirname(fileURLToPath(import.meta.url))}/metaMetricsGet.json`

 
describe('GET - MetaMetrics', function () { 
  before(async function () {
    const response = await utils.loadAppData("appdata-meta-metrics-with-pin.jsonl")
    try{
        await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
    }
    catch(err){
        console.log("no stig to upload")
    }
  })

  for(let iteration of iterations) {
   
    describe(`iteration:${iteration.name}`, function () {
        
        describe('GET - getMetricsDetailByMeta - /collections/meta/metrics/detail', function () {

            it('meta metrics detail - no agg - no params', async function () {
               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                console.log(this.test.title)
                expect(res.status).to.eql(200)

                if(iteration.name === "lvl1"){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData["lvl1"])
                }
                else if(iteration.name === "stigmanadmin")
                {
                   const data = expectedData["stigmanadmin"]
                   expect(res.body).to.deep.equalInAnyOrder(expectedData["stigmanadmin"])
                    //expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData["collectioncreator"])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                    // const data = expectedData["stigmanadmin"]
                    // expect(res.body).to.deep.equalInAnyOrder(expectedData["stigmanadmin"])
                }
                
            })
            it('meta metrics detail - no agg - coll param', async function () {
           
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail?collectionId=${reference.testCollection.collectionId}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['collectioncreator'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
        
            })
            it('meta metrics detail - no agg - bench param', async function () {

                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['collectioncreator'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
        })

        describe('GET - getMetricsDetailByMetaAggCollection - /collections/meta/metrics/detail/collection', function () {

            it('meta metrics detail - agg by collection - no params', async function () { 
               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail/collection`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('meta metrics detail - collection agg - coll param', async function () { 
               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail/collection?collectionId=${reference.testCollection.collectionId}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('meta metrics detail - collection agg - bench param', async function () { 
                
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail/collection?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('meta metrics detail - collection agg - rev param', async function () { 
       
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail/collection?revisionId=${'VPN_SRG_TEST-1-1'}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
        })

        describe('GET - getMetricsDetailByMetaAggStig - /collections/meta/metrics/detail/stig', function () {

            it('meta metrics detail - stig agg - no params', async function () {
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail/stig`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('meta metrics detail - stig agg - coll param', async function () {
               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail/stig?collectionId=${reference.testCollection.collectionId}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('meta metrics detail - stig agg - bench param', async function () {
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/detail/stig?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
        })

        describe('GET - getMetricsSummaryByMeta - /collections/meta/metrics/summary', function () {

            it('meta metrics summary- no agg - no params', async function () {
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['collectioncreator'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('meta metrics summary - no agg - collectionId param', async function () {
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary?collectionId=${reference.testCollection.collectionId}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['collectioncreator'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('meta metrics summary - no agg - benchmark param', async function () {
            
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['collectioncreator'])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
        })

        describe('GET - getMetricsSummaryByMetaAggCollection - /collections/meta/metrics/summary/collection', function () {
            
            it('Return meta metrics summary - collection agg - no params Copy', async function () {
                  
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/collection`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('Return meta metrics summary - collection agg - collection param', async function () {
                
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/collection?collectionId=${reference.testCollection.collectionId}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('Return meta metrics summary - collection agg - benchmark param', async function () {
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/collection?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('Return meta metrics summary - collection agg - rev param', async function () {
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/collection?revisionId=${'VPN_SRG_TEST'}-1-0`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('Return meta metrics summary - collection agg - rev param Copy', async function () {
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/collection?revisionId=${'VPN_SRG_TEST'}-1-1`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
        })

        describe('GET - getMetricsSummaryByMetaAggStig - /collections/meta/metrics/summary/stig', function () {

            it('Return meta metrics summary - stig agg - no params', async function () {  
               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/stig`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body). to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('Return meta metrics summary - stig agg - collection param', async function () {  
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/stig?collectionId=${reference.testCollection.collectionId}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('Return meta metrics summary - stig agg - benchmark param', async function () {  
              
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/stig?benchmarkId=${reference.benchmark}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
            it('Return meta metrics summary - stig agg - benchmark param and collection param', async function () {  
               
                const res = await utils.executeRequest(`${config.baseUrl}/collections/meta/metrics/summary/stig?benchmarkId=${reference.benchmark}&collectionId=${reference.testCollection.collectionId}`, 'GET', iteration.token)
                
                // Generates meta metrics reference file if config.generateMetricsReferenceData=true
                utils.conditionalMetricsOutput(this.test.title, iteration.name, res.body, metaMetricsUpdateFile)
                
                const expectedData = metaMetrics[this.test.title]
                expect(res.status).to.eql(200)
                if(iteration.name === 'lvl1'){
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl1'])
                }
                else if(iteration.name === 'stigmanadmin')
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['stigmanadmin'])
                }
                else if(iteration.name === "collectioncreator"){
                    expect(res.body).to.eql([])
                }
                else 
                {
                    expect(res.body).to.deep.equalInAnyOrder(expectedData[iteration.name])
                }
            })
        })
    })
  }
})


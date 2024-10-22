const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils.js')
const iterations = require('../../iterations.js')
const reference = require('../../referenceData.js')
const metrics = require('./metaMetricsGet.js')

describe('GET - MetaMetrics', function () { 
  before(async function () {
    this.timeout(4000)
    await utils.uploadTestStigs()
    await utils.loadAppData("appdata-meta-metrics-with-pin.jsonl")
    try{
        await utils.uploadTestStig("U_VPN_SRG_V1R0_Manual-xccdf.xml")
    }
    catch(err){
        console.log("no stig to upload")
    }
    await utils.createDisabledCollectionsandAssets()
  })

  for(let iteration of iterations) {
   
    describe(`iteration:${iteration.name}`, function () {
        
        describe('GET - getMetricsDetailByMeta - /collections/meta/metrics/detail', function () {

            it('meta metrics detail - no agg - no params', async function () {
               
                const res = await chai.request(config.baseUrl)
                    .get('/collections/meta/metrics/detail')
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)

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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
                
            })
            it('meta metrics detail - no agg - coll param', async function () {
           
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/detail?collectionId=${reference.testCollection.collectionId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
        
            })
            it('meta metrics detail - no agg - bench param', async function () {

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/detail?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
        })

        describe('GET - getMetricsDetailByMetaAggCollection - /collections/meta/metrics/detail/collection', function () {

            it('meta metrics detail - agg by collection - no params', async function () { 
               
                const res = await chai.request(config.baseUrl)
                    .get('/collections/meta/metrics/detail/collection')
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('meta metrics detail - collection agg - coll param', async function () { 
               
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/detail/collection?collectionId=${reference.testCollection.collectionId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('meta metrics detail - collection agg - bench param', async function () { 
                
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/detail/collection?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('meta metrics detail - collection agg - rev param', async function () { 
       
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/detail/collection?revisionId=${'VPN_SRG_TEST-1-1'}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
        })

        describe('GET - getMetricsDetailByMetaAggStig - /collections/meta/metrics/detail/stig', function () {

            it('meta metrics detail - stig agg - no params', async function () {
              
                const res = await chai.request(config.baseUrl)
                    .get('/collections/meta/metrics/detail/stig')
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('meta metrics detail - stig agg - coll param', async function () {
               
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/detail/stig?collectionId=${reference.testCollection.collectionId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('meta metrics detail - stig agg - bench param', async function () {
              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/detail/stig?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
        })

        describe('GET - getMetricsSummaryByMeta - /collections/meta/metrics/summary', function () {

            it('meta metrics summary- no agg - no params', async function () {
              
                const res = await chai.request(config.baseUrl)
                    .get('/collections/meta/metrics/summary')
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('meta metrics summary - no agg - collectionId param', async function () {
              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary?collectionId=${reference.testCollection.collectionId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('meta metrics summary - no agg - benchmark param', async function () {
            
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
        })

        describe('GET - getMetricsSummaryByMetaAggCollection - /collections/meta/metrics/summary/collection', function () {
            
            it('Return meta metrics summary - collection agg - no params Copy', async function () {
                  
                const res = await chai.request(config.baseUrl)
                    .get('/collections/meta/metrics/summary/collection')
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('Return meta metrics summary - collection agg - collection param', async function () {
                
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary/collection?collectionId=${reference.testCollection.collectionId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('Return meta metrics summary - collection agg - benchmark param', async function () {
              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary/collection?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('Return meta metrics summary - collection agg - rev param', async function () {
              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary/collection?revisionId=${'VPN_SRG_TEST'}-1-0`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('Return meta metrics summary - collection agg - rev param Copy', async function () {
              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary/collection?revisionId=${'VPN_SRG_TEST'}-1-1`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
        })

        describe('GET - getMetricsSummaryByMetaAggStig - /collections/meta/metrics/summary/stig', function () {

            it('Return meta metrics summary - stig agg - no params', async function () {  
               
                const res = await chai.request(config.baseUrl)
                    .get('/collections/meta/metrics/summary/stig')
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('Return meta metrics summary - stig agg - collection param', async function () {  
              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary/stig?collectionId=${reference.testCollection.collectionId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('Return meta metrics summary - stig agg - benchmark param', async function () {  
              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary/stig?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
            it('Return meta metrics summary - stig agg - benchmark param and collection param', async function () {  
               
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/meta/metrics/summary/stig?benchmarkId=${reference.benchmark}&collectionId=${reference.testCollection.collectionId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                const expectedData = metrics[this.test.title]
                expect(res).to.have.status(200)
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
                    expect(res.body).to.deep.equalInAnyOrder(expectedData['lvl3lvl4'])
                }
            })
        })
    })
  }
})


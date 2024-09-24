const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const { expect } = chai
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils.js')
const iterations = require('../../iterations.js')
const reference = require('../../referenceData.js')
const metrics = require('./metricsGet.js')

describe('GET - Metrics', function () { 
  before(async function () {
    this.timeout(4000)
    await utils.uploadTestStigs()
    await utils.loadAppData()
    await utils.createDisabledCollectionsandAssets()
  })

  for(const iteration of iterations){
    describe(`iteration:${iteration.name}`, function () {
        
        describe('GET - getMetricsDetailByCollection - /collections/{collectionId}/metrics/detail', function () {

            it('Return detailed metrics for the specified Collection no param', async function () {
            const res = await chai.request(config.baseUrl)
                .get(`/collections/${reference.testCollection.collectionId}/metrics/detail`)
                .set('Authorization', `Bearer ${iteration.token}`)
            if(iteration.name === "collectioncreator"){
                expect(res).to.have.status(403)
                return
            }
            expect(res).to.have.status(200)
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
                const res = await chai.request(config.baseUrl)
                .get(`/collections/${reference.testCollection.collectionId}/metrics/detail?benchmarkId=${reference.benchmark}&assetId=${reference.testAsset.assetId}&labelName=${reference.testCollection.fullLabelName}`)
                .set('Authorization', `Bearer ${iteration.token}`)

                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/asset`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/asset?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/asset?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/asset?benchmarkId=${reference.benchmark}&assetId=${reference.testAsset.assetId}&labelId=${reference.testCollection.fullLabel}&labelName=${reference.testCollection.fullLabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/asset?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/asset?labelName=${reference.testCollection.fullLabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/collection`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/collection?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
            

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/collection?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/collection?labelName=${reference.testCollection.fullLabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
            
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/collection?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/label`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

             
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/label?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

            
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/label?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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


                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/label?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/label?labelName=${reference.testCollection.lvl1LabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/stig`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

            
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/stig?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

            
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/stig?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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


                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/stig?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/detail/stig?labelName=${reference.testCollection.lvl1LabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
                const res = await chai.request(config.baseUrl)
                .get(`/collections/${reference.testCollection.collectionId}/metrics/summary?benchmarkId=${reference.benchmark}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary?labelName=${reference.testCollection.lvl1LabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/asset`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/asset?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/asset?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/asset?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/asset?labelName=${reference.testCollection.fullLabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/collection`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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


                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/collection?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
              

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/collection?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
               
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/collection?labelName=${reference.testCollection.fullLabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
              

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/collection?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

               
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/label`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

              
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/label?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

            
                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/label?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

        

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/label?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                   
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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


                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/label?labelName=${reference.testCollection.lvl1LabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/stig`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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


                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/stig?benchmarkId=${reference.benchmark}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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


                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/stig?assetId=${reference.testAsset.assetId}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/stig?labelId=${reference.testCollection.fullLabel}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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
                

                const res = await chai.request(config.baseUrl)
                    .get(`/collections/${reference.testCollection.collectionId}/metrics/summary/stig?labelName=${reference.testCollection.fullLabelName}`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                if(iteration.name === "collectioncreator"){
                    expect(res).to.have.status(403)
                    return
                }
                expect(res).to.have.status(200)
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


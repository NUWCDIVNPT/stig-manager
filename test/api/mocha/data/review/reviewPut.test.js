const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const xml2js = require('xml2js');
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies.js')

describe('PUT - Review', () => {

    let deletedCollection, deletedAsset
    before(async function () {
        this.timeout(4000)
        await utils.uploadTestStigs()
        await utils.loadAppData()
        const deletedItems = await utils.createDisabledCollectionsandAssets()
        deletedCollection = deletedItems.collection
        deletedAsset = deletedItems.asset
    })

    for(const iteration of iterations){
        if (expectations[iteration.name] === undefined){
            it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
            continue
        }
        describe(`iteration:${iteration.name}`, () => {
            const distinct = expectations[iteration.name]
            describe('PUT - putReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {
       
                it('PUT Review: accepted, pass, no detail', async () => {

                    const putBody = {
                        result: 'pass',
                        detail: '',
                        comment: 'sure',
                        status: 'accepted',
                        autoResult: false
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)

                    expect(res).to.have.status(403)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property("error")
                })
                it('PUT Review: saved, pass, no detail', async () => {

                    const putBody = {
                        result: 'pass',
                        detail: '',
                        comment: 'sure',
                        status: 'saved',
                        autoResult: false
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)
                 
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property("result")
                    expect(res.body).to.have.property("detail")
                    expect(res.body).to.have.property("comment")
                    expect(res.body).to.have.property("status")
                    expect(res.body.result).to.equal(putBody.result)
                    expect(res.body.detail).to.equal(putBody.detail)
                    expect(res.body.comment).to.equal(putBody.comment)
                    expect(res.body.status.label).to.equal(putBody.status)
                })
                it('PUT Review: submit, fail, no comment', async () => {

                    const putBody = {
                        result: 'fail',
                        detail: 'string',
                        comment: '',
                        status: 'submitted',
                        autoResult: false
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)

                    expect(res).to.have.status(403)
                })
                it('PUT Review: submitted, pass, no detail Copy', async () => {

                    const putBody = {
                        result: 'pass',
                        detail: '',
                        comment: 'sure',
                        status: 'submitted',
                        autoResult: false
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)

                    expect(res).to.have.status(403)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property("error")
                })
                it('Check that informational results are represented as NotReviewd with Finding Details data in .ckls', async () => {

                    const putBody = {
                    result: 'informational',
                    detail:
                        'test\nvisible to lvl1, THIS REVIEW IS INFORMATIONAL (but comes back as Not_Reviewed in a ckl)',
                    comment: 'sure',
                    autoResult: false,
                    status: 'saved'
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}?projection=rule&projection=history&projection=stigs`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)
                  
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property("result")
                    expect(res.body).to.have.property("detail")
                    expect(res.body).to.have.property("comment")
                    expect(res.body).to.have.property("status")
                    expect(res.body.result).to.equal(putBody.result)
                    expect(res.body.detail).to.equal(putBody.detail)
                    expect(res.body.comment).to.equal(putBody.comment)
                    expect(res.body.status.label).to.equal(putBody.status)

                    const review = await utils.getChecklist(reference.testAsset.assetId, reference.benchmark, reference.revisionStr)

                    let cklData
                    xml2js.parseString(review, function (err, result) {
                        cklData = result;
                    })
                    let cklIStigs = cklData.CHECKLIST.STIGS[0].iSTIG
                    let currentStigId

                    for(let stig of cklIStigs){
                        for(let cklData of stig.STIG_INFO[0].SI_DATA){
                            if (cklData.SID_NAME[0] == 'stigid'){
                                currentStigId = cklData.SID_DATA[0]
                                expect(currentStigId).to.be.oneOf(reference.testCollection.validStigs);
                            }
                        }
                        let cklVulns = stig.VULN;
                        expect(cklVulns).to.be.an('array')

                        if (currentStigId == 'VPN_SRG_TEST') {
                            expect(cklVulns).to.be.an('array').of.length(reference.checklistLength);
                            for (let thisVuln of cklVulns){
                                for (let stigData of thisVuln.STIG_DATA){
                                    if (stigData.ATTRIBUTE_DATA[0] == 'SV-106179r1_rule'){
                                        var commentRegex = new RegExp("INFORMATIONAL");
                                        var statusRegex = new RegExp("Not_Reviewed");
                                        expect(thisVuln.FINDING_DETAILS[0]).to.match(commentRegex);
                                        expect(thisVuln.STATUS[0]).to.match(statusRegex);
                                    }
                                }
                            }

                        }

                    }
                })
                it('Set all properties of a Review - invalid result enum', async () => {

                    const putBody = {
                        result: 'invalid',
                        detail: '',
                        comment: 'sure',
                        status: 'submitted',
                        autoResult: false
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)

                    expect(res).to.have.status(400)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property("error")
                })
                it('Set all properties of a Review - with metadata', async () => {

                    const putBody = JSON.parse(JSON.stringify({
                        result: 'pass',
                        detail: 'test\nvisible to lvl1',
                        comment: 'sure',
                        autoResult: false,
                        status: 'submitted',
                        metadata: {
                            [reference.reviewMetadataKey]: reference.reviewMetadataValue
                        }
                    }))

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}?projection=rule&projection=history&projection=stigs&projection=metadata`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)
                   
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body).to.have.property("result")
                    expect(res.body).to.have.property("detail")
                    expect(res.body).to.have.property("comment")
                    expect(res.body).to.have.property("status")
                    expect(res.body).to.have.property("metadata")
                    expect(res.body.result).to.equal(putBody.result)
                    expect(res.body.detail).to.equal(putBody.detail)
                    expect(res.body.comment).to.equal(putBody.comment)
                    expect(res.body.status.label).to.equal(putBody.status)
                    expect(res.body.metadata).to.be.an('object')
                    expect(res.body.metadata).to.have.property(reference.reviewMetadataKey)
                    expect(res.body.metadata[reference.reviewMetadataKey]).to.be.equal(reference.reviewMetadataValue)

                })
                it('PUT Review: asset in deleted collection', async () => {

                    const putBody = {
                        result: 'pass',
                        detail: 'test\nvisible to lvl1',
                        comment: 'sure',
                        autoResult: false,
                        status: 'submitted'
                    }
                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${deletedCollection.collectionId}/reviews/${deletedAsset.assetId}/${reference.testCollection.ruleId}`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)

                    expect(res).to.have.status(403)
                })
                it('Test all projections are returned and contain accurate data. (besides history that is tested better elsewhere)', async () => {

                    const putBody = {
                        result: 'pass',
                        detail: 'test\nvisible to lvl1',
                        comment: 'sure',
                        autoResult: false,
                        status: 'submitted'
                    }

                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}?projection=rule&projection=stigs&projection=metadata`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .send(putBody)
                   
                    expect(res).to.have.status(200)
                    expect(res.body).to.be.an('object')
                    expect(res.body.result).to.equal(putBody.result)
                    expect(res.body.detail).to.equal(putBody.detail)
                    expect(res.body.comment).to.equal(putBody.comment)
                    expect(res.body.status.label).to.equal(putBody.status)
                    expect(res.body.metadata).to.be.an('object')
                    expect(res.body.metadata).to.have.property(reference.reviewMetadataKey)
                    expect(res.body.metadata[reference.reviewMetadataKey]).to.be.equal(reference.reviewMetadataValue)

                    //projections
                    expect(res.body).to.have.property("rule")
                    expect(res.body).to.have.property("stigs")
                    expect(res.body).to.have.property("metadata")

                    expect(res.body.rule.ruleId).to.be.eql(reference.testCollection.ruleId)
                    expect(res.body.stigs).to.have.lengthOf(1)
                    expect(res.body.metadata).to.have.property(reference.reviewMetadataKey)
                    expect(res.body.metadata[reference.reviewMetadataKey]).to.be.equal(reference.reviewMetadataValue)

                    expect(res.body.rule).to.be.an('object')
                    expect(res.body.rule.ruleId).to.be.eql(reference.testCollection.ruleId)
                })
                it('Set properties of a Review ', async () => {

                    const putBody = {
                        "autoResult": true,
                        "comment": "comment",
                        "detail": "detail",
                        "metadata": {
                            "additionalProp1": "string",
                            
                        },
                        "result": "fail",
                        "resultEngine": {
                            "checkContent": {
                            "component": "string",
                            "location": "string"
                            },
                            "overrides": [
                            {
                                "authority": "string",
                                "newResult": "fail",
                                "oldResult": "fail",
                                "remark": "string",
                                "time": "2024-06-05T17:01:07.162Z"
                            }
                            ],
                            "product": "string",
                            "time": "2024-06-05T17:01:07.162Z",
                            "type": "scap",
                            "version": "string"
                        },
                        "status": "saved"
                    }
                    
                    const res = await chai.request(config.baseUrl)
                    .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}?projection=rule&projection=history&projection=stigs&projection=metadata`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    .send(putBody)
                   
                    expect(res).to.have.status(200)
                    expect(res.body.assetId).to.be.eql(reference.testAsset.assetId)
                    expect(res.body.result).to.be.eql(putBody.result)
                    expect(res.body.detail).to.be.eql(putBody.detail)
                    expect(res.body.comment).to.be.eql(putBody.comment)
                    expect(res.body.status.label).to.be.eql(putBody.status)
                    expect(res.body.metadata).to.be.eql(putBody.metadata)
                    expect(res.body.resultEngine).to.be.eql(putBody.resultEngine)

                })
            })

            describe('PUT - putReviewMetadata - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata', () => {

                before(async function () {
                    this.timeout(4000)
                    await utils.putReviewByAssetRule(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testCollection.ruleId, requestBodies.resetRule)
                })
                
                it('Set all metadata of a Review', async () => {
                    const res = await chai.request(config.baseUrl)
                    .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`)
                    .set('Authorization', `Bearer ${iteration.token}`)
                    .send({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
                    
                    expect(res).to.have.status(200)
                    expect(res.body).to.eql({[reference.reviewMetadataKey]: reference.reviewMetadataValue})

                })
                it("should return SmError.PrivilegeError if user cannot put review", async () => {
                    const res = await chai.request(config.baseUrl)
                        .get(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.scrapRuleIdWindows10}/metadata`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                    if(distinct.canPatchReview){
                        expect(res).to.have.status(200)
                        return
                    }
                    expect(res).to.have.status(403)
                    expect(res.body.error).to.be.equal("User has insufficient privilege to complete this request.")
                })
            })

            describe('PUT - putReviewMetadataValue - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys/{key}', () => {

                before(async function () {
                    this.timeout(4000)
                    await utils.putReviewByAssetRule(reference.testCollection.collectionId, reference.testAsset.assetId, reference.testCollection.ruleId, requestBodies.resetRule)
                })
                it('Set one metadata key/value of a Review', async () => {
                    const res = await chai.request(config.baseUrl)
                        .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata/keys/${reference.reviewMetadataKey}`)
                        .set('Authorization', `Bearer ${iteration.token}`)
                        .set('Content-Type', 'application/json') 
                        .send(`${JSON.stringify(reference.reviewMetadataValue)}`)
                    
                    expect(res).to.have.status(204)
                })
            })
        })
    }
})


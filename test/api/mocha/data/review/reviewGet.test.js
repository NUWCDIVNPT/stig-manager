
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import { expect } from 'chai'

describe('GET - Review', () => {
  
  before(async function () {
    await utils.loadAppData()
  })

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async () => {})
      continue
    }
    describe(`iteration:${iteration.name}`, () => {
      const distinct = expectations[iteration.name]
      describe('GET - getReviewsByCollection - /collections/{collectionId}/reviews', () => {
        
        it('Return a list of reviews accessible to the requester', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)

          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')

          for(let review of res.body){
            if(iteration.name === 'lvl1'){
              if(review.assetId === "62"){
                expect(review.access).to.be.equal('r')
              }
              if(review.assetId === "154" && review.ruleId === reference.testCollection.benchmark){
                expect(review.access).to.be.equal('r')
              }
            }
            else {
              expect(review.access).to.be.equal('rw')
            }
            expect(review.assetId).to.be.oneOf(reference.testCollection.assetIds)
            for(let assetLabelId of review.assetLabelIds){
              expect(assetLabelId).to.be.oneOf(reference.testAsset.labels)
            }
            for(let stig of review.stigs){
              expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
            }
            if(review.assetId === reference.testAsset.assetId){
              expect(review.status.label).to.be.oneOf(['saved', 'submitted'])
              expect(review.ruleId).to.be.oneOf(reference.testAsset.reviewRuleIds)
            }
          }
        })
        it('Return a list of reviews accessible to the requester, assetId Projection.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?assetId=${reference.testAsset.assetId}&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
  
          expect(res.status).to.eql(200)
    
          expect(res.body).to.be.lengthOf(distinct.testAsset.reviewsAvailableToUser)

          for(let review of res.body){
            expect(review.access).to.be.equal('rw')
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            for(let assetLabelId of review.assetLabelIds){
              expect(assetLabelId).to.be.oneOf(reference.testAsset.labels)
            }
            for(let stig of review.stigs){
              expect(stig).to.have.property('benchmarkId')
              expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
            }
            if(review.assetId === reference.testAsset.assetId){
              expect(review.status.label).to.be.oneOf(['saved', 'submitted'])
              expect(review.ruleId).to.be.oneOf(reference.testAsset.reviewRuleIds)
            }
          }
        })
        it('Return a list of reviews accessible to the requester, benchmarkId Projection.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?benchmarkId=${reference.benchmark}&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.lengthOf(distinct.testCollection.reviewsForTestBenchmark)
          for(let review of res.body){
            if(iteration.name === 'lvl1'){
              if(review.assetId === "62"){
                expect(review.access).to.be.equal('r')
              }
              if(review.assetId === "154" && review.ruleId === reference.testCollection.benchmark){
                expect(review.access).to.be.equal('r')
              }
            }
            else {
              expect(review.access).to.be.equal('rw')
            }
            for(let stig of review.stigs){
              expect(stig).to.have.property('benchmarkId')
              expect(stig.benchmarkId).to.be.equal(reference.testCollection.benchmark)
            }        
          }
        })
        it('Return a list of reviews accessible to the requester, metadata Projection.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?projection=rule&projection=stigs&metadata=${reference.reviewMetadataKey}%3A${reference.reviewMetadataValue}&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(1)

          for(let review of res.body){
            expect(review.metadata).to.be.an('object')
            expect(review.metadata).to.have.property(reference.reviewMetadataKey)
            expect(review.metadata[reference.reviewMetadataKey]).to.be.equal(reference.reviewMetadataValue)
          }
        })
        it('Return a list of reviews accessible to the requester, metadata Projection. issue 1357', async () => {
          const tempCollectionWithMetadata = await utils.createTempCollection(
            {
              name: 'tempCollection' + utils.getUUIDSubString(),
              description: 'Collection TEST description',
              settings: {
                fields: {
                  detail: {
                    enabled: 'always',
                    required: 'findings'
                  },
                  comment: {
                    enabled: 'always',
                    required: 'findings'
                  }
                },
                status: {
                  canAccept: true,
                  minAcceptGrant: 2,
                  resetCriteria: 'result'
                },
                history: {
                  maxReviews: 11
                }
              },
              metadata: {
                testKey: 'test:value',
              },
              grants: [
                {
                  userId: '1',
                  roleId: 4
                },
                {
                  userId: '85',
                  roleId: 1
                }
              ],
              labels: [
              ]
            })
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${tempCollectionWithMetadata.collectionId}/reviews?projection=rule&projection=stigs&metadata=testKey%3Atest%3Avalue&projection=metadata`, 'GET', iteration.token)
          if(iteration.name === 'lvl2' || iteration.name === 'lvl3' || iteration.name === 'lvl4') {
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(0)
        })
        it('Return a list of reviews accessible to the requester, result projection fail only', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?result=fail&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(distinct.testCollection.reviewsForResultFailAllAssets)
        
          for(let review of res.body){
            expect(review.result).to.be.equal('fail')
          }
        })
        it('Return a list of reviews accessible to the requester, ruleid projection', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?ruleId=${reference.testCollection.ruleId}&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
          
          expect(res.status).to.eql(200)
          expect(res.body).to.be.lengthOf(distinct.testCollection.reviewsForTestRuleId)

          for(let review of res.body){
            expect(review.ruleId).to.be.equal(reference.testCollection.ruleId)
            expect(review.rule.ruleId).to.be.equal(reference.testCollection.ruleId)
            expect(review.ruleIds).to.include(reference.testCollection.ruleId)
          }
        })
        it('Return a list of reviews accessible to the requester, status projection: saved.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?status=saved&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
        
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(distinct.testCollection.reviewsForStatusSaved)

          for(let review of res.body){
            expect(review.status.label).to.be.equal('saved')
          }
        })
        it('Return a list of reviews accessible to the requester, userId projection.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?userId=${reference.stigmanadmin.userId}&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
          
          expect(res.status).to.eql(200)
          expect(res.body).to.be.lengthOf(distinct.testCollection.reviewsForStigmanadmin)

          for(let review of res.body){
            expect(review.userId).to.be.equal(reference.stigmanadmin.userId)
          }
        })
        it('Return a list of reviews accessible to the requester, cci prjections', async () => {
          
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?cci=${reference.testCci.id}`, 'GET', iteration.token)

          expect(res.status).to.eql(200)
        })
        it('Return a list of reviews accessible to the requester, groupid', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?groupId=${reference.testGroupId}`, 'GET', iteration.token)

          expect(res.status).to.eql(200)

          expect(res.body).to.be.an('array').of.length(distinct.testCollection.reviewsForTestGroup)

          for(let review of res.body){
            expect(review.assetId).to.be.oneOf(reference.testCollection.assetIds)
          }
        })
        it('Return a list of reviews accessible to the requester, rules=all', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=all`, 'GET', iteration.token)

          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(distinct.testCollection.reviewsForRulesAll)

          for(let review of res.body){
            expect(review.assetId).to.be.oneOf(reference.testCollection.assetIds)
          }
        })
        it('Return a list of reviews accessible to the requester, rules=default-mapped', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=default-mapped`, 'GET', iteration.token)

          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(distinct.testCollection.reviewsForRulesAll)

          for(let review of res.body){
            expect(review.assetId).to.be.oneOf(reference.testCollection.assetIds)
          }
        })
        it('Return a list of reviews accessible to the requester, rules=not-default', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=not-default`, 'GET', iteration.token)

          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(distinct.testCollection.reviewsDefaultMapped)

          for(let review of res.body){
            expect(review.assetId).to.be.oneOf(reference.testCollection.assetIds)
          }
        })
        it('Return a list of reviews accessible to the requester, rules=default', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=default`, 'GET', iteration.token)

          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(distinct.testCollection.reviewsForRulesAll)

          for(let review of res.body){
            expect(review.assetId).to.be.oneOf(reference.testCollection.assetIds)
          }
        })
        it('Return a list of reviews accessible to the requester, rules=not-default-mapped', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews?rules=not-default-mapped`, 'GET', iteration.token)

          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(0)
        })
      })
      describe('GET - getReviewsByAsset - /collections/{collectionId}/reviews/{assetId}', () => {

        it('Return a list of Reviews for an Asset', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
   
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array').of.length(distinct.testAsset.reviewsAvailableToUser)
          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            for(let assetLabelId of review.assetLabelIds){
              expect(assetLabelId).to.be.oneOf(reference.testAsset.labels)
            }
            for(let stig of review.stigs){
              expect(stig.benchmarkId).to.be.oneOf(reference.testAsset.validStigs)
              
            }
            if(review.ruleId === reference.testAsset.testRuleId){
              expect(review.metadata, "metadata").to.eql({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
              expect(review.status.label, "expect review to be submitted").to.be.oneOf(['submitted'])
              expect(review.result, "expect result to be pass").to.eql('pass')
              for(const stig of review.stigs){
                expect(stig.benchmarkId, "expect stig attached to be test bernchmark").to.be.equal(reference.benchmark)
                expect(stig.ruleCount, "Expect 81 rules for vpn srg test").to.be.equal(reference.checklistLength)
                expect(stig.revisionStr, "expect default reviison").to.be.equal(reference.revisionStr)
              }
            }
            else{
              expect(review.metadata).to.be.empty
            }
          }
        })
        it("should return all reviews for asset ID 62, which is r only for lvl1 user", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/62`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
          //expect(res.body).to.be.an('array').of.length(2)
          for(let review of res.body){
            expect(review.assetId).to.be.equal("62")
            if(iteration.name === 'lvl1'){
              expect(review.access).to.be.equal('r')
            }
            else {
              expect(review.access).to.be.equal('rw')
            }
          }

        })
        it('Return a list of Reviews for an Asset, benchmarkId Projection.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?benchmarkId=${reference.benchmark}&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(reference.testAsset.testBenchmarkReviews)

          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            for(let stig of review.stigs){
              expect(stig).to.have.property('benchmarkId')
              expect(stig.benchmarkId).to.be.equal(reference.testCollection.benchmark)
            }
            if(review.ruleId === reference.testAsset.testRuleId){
              expect(review.metadata, "metadata").to.eql({[reference.reviewMetadataKey]: reference.reviewMetadataValue})
              expect(review.status.label, "expect review to be submitted").to.be.oneOf(['submitted'])
              expect(review.result, "expect result to be pass").to.eql('pass')
              for(const stig of review.stigs){
                expect(stig.benchmarkId, "expect stig attached to be test bernchmark").to.be.equal(reference.benchmark)
                expect(stig.ruleCount, "Expect 81 rules for vpn srg test").to.be.equal(reference.checklistLength)
                expect(stig.revisionStr, "expect default reviison").to.be.equal(reference.revisionStr)
              }
            }
          }
        })
        it("should return all review for assetID 154 which for lvl1 is r only on benchmark VPN_SRG_TEST", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/154?benchmarkId=VPN_SRG_TEST`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
          for(let review of res.body){
            expect(review.assetId).to.be.equal("154")
            if(iteration.name === 'lvl1'){
              expect(review.access).to.be.equal('r')
            }
            else {
              expect(review.access).to.be.equal('rw')
            }
          }

        })
        it('Return a list of Reviews for an Asset , metadata Projection.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?projection=rule&projection=stigs&metadata=${reference.reviewMetadataKey}%3A${reference.reviewMetadataValue}&projection=metadata`, 'GET', iteration.token)
  
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(1)

          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            expect(review.metadata).to.be.an('object')
            expect(review.metadata).to.have.property(reference.reviewMetadataKey)
            expect(review.metadata[reference.reviewMetadataKey]).to.be.equal(reference.reviewMetadataValue)
          }
        })
        it('Return a list of reviews accessible to the requester, result projection pass only', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?result=pass&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
         
          expect(res.body).to.be.lengthOf(distinct.testAsset.reviewsForResultPass)
        

          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            expect(review.result).to.be.equal('pass')
          }
        })
        it('Return a list of reviews accessible to the requester, result projection fail only', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?result=fail&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(distinct.testAsset.reviewsForResultFail)

          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            expect(review.result).to.be.equal('fail')
          }
        })
        it('Return a list of reviews accessible to the requester, result projection informational only', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?result=informational&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(0)

          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            expect(review.result).to.be.equal('informational')
          }
        })
        it('Return a list of reviews accessible to the requester, status projection: saved.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?status=saved&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
          
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(distinct.testAsset.reviewsForStatusSaved)
         

          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            expect(review.status.label).to.be.equal('saved')
          }
        })
        it('Return a list of reviews accessible to the requester, status projection: submitted.', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}?status=submitted&projection=rule&projection=stigs&projection=metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          expect(res.body).to.be.lengthOf(distinct.testAsset.reviewsForStatusSubmitted)
          
          for(let review of res.body){
            expect(review.assetId).to.be.equal(reference.testAsset.assetId)
            expect(review.status.label).to.be.equal('submitted')
          }
        })
      })
      describe('GET - getReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}', () => {

        it('Return the Review for an Asset and Rule', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}?projection=rule&projection=stigs&projection=metadata&projection=history`, 'GET', iteration.token)
        
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')

          const review = res.body
        
          // checking for basic properties
          expect(review.rule.ruleId).to.be.equal(reference.testCollection.ruleId)
          expect(review.metadata).to.have.property(reference.reviewMetadataKey)
          expect(review.metadata[reference.reviewMetadataKey]).to.be.equal(reference.reviewMetadataValue)
          for(let stig of review.stigs){
            expect(stig.benchmarkId, "expect stig attached to be test bernchmark").to.be.equal(reference.benchmark)
            expect(stig.ruleCount, "Expect 81 rules for vpn srg test").to.be.equal(reference.checklistLength)
            expect(stig.revisionStr, "expect default reviison").to.be.equal(reference.revisionStr)
          }
          expect(review.assetLabelIds).to.include.members(reference.testAsset.labels)
          expect(review.status.label, "expect review to be submitted").to.be.oneOf(['submitted'])
          expect(review.result, "expect result to be pass").to.eql('pass')
        })
      })
      describe('GET - getReviewMetadata - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata', () => {
        it('Return the metadata for a Review', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata`, 'GET', iteration.token)
         
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          expect(res.body).to.have.property(reference.reviewMetadataKey)
          expect(res.body[reference.reviewMetadataKey]).to.be.equal(reference.reviewMetadataValue)
        })
        // useless if we test other users 
        if(iteration.name === 'lvl1'){
          it("should return SmError.PrivilegeError if user cannot access review", async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.scrapRuleIdWindows10}/metadata`, 'GET', iteration.token)
            expect(res.status).to.eql(403)
            expect(res.body.error).to.be.equal("User has insufficient privilege to complete this request.")
          })
        }
      })
      describe('GET - getReviewMetadataKeys - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys', () => {
          
          it('Return the Review Metadata KEYS for an Asset and Rule', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata/keys`, 'GET', iteration.token)
          
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array')
            expect(res.body).to.be.lengthOf(1)
            expect(res.body).to.include(reference.reviewMetadataKey)
          })
      })
      describe('GET - getReviewMetadataValue - /collections/{collectionId}/reviews/{assetId}/{ruleId}/metadata/keys/{key}', () => {

        it('Return the Review Metadata VALUE for an Asset/Rule/metadata KEY', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata/keys/${reference.reviewMetadataKey}`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('string')
          expect(res.body).to.equal(reference.reviewMetadataValue)  
        })
        it('Should throw SmError.NotFoundError no metadatakey found', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}/metadata/keys/notakey`, 'GET', iteration.token)
          expect(res.status).to.eql(404)
          expect(res.body.error).to.be.equal("Resource not found.")
        })
      })
    })
  }
})
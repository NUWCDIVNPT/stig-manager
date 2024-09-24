const chai = require('chai')
const chaiHttp = require('chai-http')
const { v4: uuidv4 } = require('uuid')
chai.use(chaiHttp)
const expect = chai.expect
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(deepEqualInAnyOrder)
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')

describe('GET - Collection', function () {

  before(async function () {
    this.timeout(4000)
    await utils.uploadTestStigs()
    await utils.loadAppData()
    await utils.createDisabledCollectionsandAssets()
  })

  for(const iteration of iterations){
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }

    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
    
      describe('getCollections - /collections', function () {
        if (iteration.name === 'stigmanadmin' ){

          it('Return Collections accessible to the requester No Filters - elevated stigmanadmin only', async function () {

            const res = await chai.request(config.baseUrl)
              .get('/collections?projection=owners&projection=statistics&elevate=true')
              .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(200)
            // expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(distinct.collectionCountElevated)
            //check statistics projection
            const testCollection = res.body.find(collection => collection.collectionId === reference.testCollection.collectionId)
            const testCollectionOwnerArray = testCollection.owners.map(owner => owner.userId)

            expect(testCollectionOwnerArray, "proper owners").to.have.members(reference.testCollection.owners)
            expect(testCollection.statistics.assetCount, "asset count").to.equal(distinct.assetIds.length)
            expect(testCollection.statistics.checklistCount, "checklist count").to.equal(distinct.checklistCnt)
            expect(testCollection.statistics.grantCount, "grant count").to.equal(distinct.grantCnt)
          })
        }

        it('Return a list of Collections accessible to the requester No Filters no elevate!',async function () {
            const res = await chai.request(config.baseUrl)
              .get('/collections?projection=owners&projection=statistics')
              .set('Authorization', `Bearer ${iteration.token}`)
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(distinct.collectionCount)
            for(const collection of res.body){
              expect(collection.collectionId).to.be.oneOf(distinct.collectionIdsAccess)
            }
        })
        it('Return a list of Collections accessible to the requester METADATA',async function () {
            const res = await chai.request(config.baseUrl)
              .get(`/collections?metadata=${reference.testCollection.collectionMetadataKey}%3A${reference.testCollection.collectionMetadataValue}`)
              .set('Authorization', `Bearer ${iteration.token}`)
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionMetadataMatchCnt)
            if (distinct.collectionMatch.collectionContainsMatchCnt == 0) {
              return
            }
            const regex  = new RegExp(reference.testCollection.name)
            expect(res.body[0].name).to.match(regex)
            expect(res.body[0].collectionId).to.equal(reference.testCollection.collectionId)
            expect(res.body[0].metadata[reference.testCollection.collectionMetadataKey]).to.equal(reference.testCollection.collectionMetadataValue)

        })
        it('Return a list of Collections accessible to the requester METADATA param but with a colon character (see issue 1357)',async function () {
          const tempCollectionWithMetadata = await utils.createTempCollection(
            {
              name: 'tempCollection' + Math.floor(Math.random() * 1000),
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
                  accessLevel: 4
                },
                {
                  userId: '85',
                  accessLevel: 1
                }
              ],
              labels: [
              ]
            })
          
          const res = await chai.request(config.baseUrl)
            .get(`/collections?metadata=testKey%3Atest%3Avalue`)
            .set('Authorization', `Bearer ${iteration.token}`)
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array')
          if(iteration.name !== 'stigmanadmin'){
            expect(res.body).to.have.lengthOf(0)
            return
          }
          expect(res.body).to.have.lengthOf(1)
          expect(res.body[0].collectionId).to.equal(tempCollectionWithMetadata.data.collectionId)
        })
        it('Return a list of Collections accessible to the requester NAME exact',async function () {
        const res = await chai.request(config.baseUrl)
            .get(`/collections?name=${reference.testCollection.name}&name-match=exact`)
            .set('Authorization', `Bearer ${iteration.token}`)
        expect(res).to.have.status(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionExactMatchCnt)
        if (distinct.collectionMatch.collectionExactMatchCnt == 0) {
          return
        }
        const regex  = new RegExp(reference.testCollection.name)
        expect(res.body[0].name).to.match(regex)
        expect(res.body[0].collectionId).to.equal(reference.testCollection.collectionId)
        })
        it('Return a list of Collections accessible to the requester NAME starts With',async function () {
        const res = await chai.request(config.baseUrl)
            .get(`/collections?name=${'Collection'}&name-match=startsWith`)
            .set('Authorization', `Bearer ${iteration.token}`)
        expect(res).to.have.status(200)
        
        expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionStartMatchCnt)
        if (distinct.collectionMatch.collectionContainsMatchCnt == 0) {
          return
        }

        for(const collection of res.body){
            expect(collection.name).to.have.string('Collection')
        }
        })
        it('Return a list of Collections accessible to the requester NAME ends With',async function () {
        const res = await chai.request(config.baseUrl)
            .get(`/collections?name=${'X'}&name-match=endsWith`)
            .set('Authorization', `Bearer ${iteration.token}`)
        expect(res).to.have.status(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionEndMatchCnt)
        if (distinct.collectionMatch.collectionContainsMatchCnt == 0) {
          return
        }
        expect(res.body[0].name).to.have.string('X')
        })
        it('Return a list of Collections accessible to the requester NAME contains elevated',async function () {
        const res = await chai.request(config.baseUrl)
            .get(`/collections?name=${'delete'}&name-match=contains&elevate=true`)
            .set('Authorization', `Bearer ${iteration.token}`)
        if(iteration.name !== 'stigmanadmin'){
          expect(res).to.have.status(403)
          return
        } 
        expect(res).to.have.status(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionDeleteMatchCntElevated)
        expect(res.body[0].name).to.have.string('delete')
        })
        it('Return a list of Collections accessible to the requester NAME contains no elevate',async function () {
          const res = await chai.request(config.baseUrl)
              .get(`/collections?name=${'delete'}&name-match=contains`)
              .set('Authorization', `Bearer ${iteration.token}`)
          expect(res).to.have.status(200)
          expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionDeleteMatchCnt)
          if (distinct.collectionMatch.collectionDeleteMatchCnt > 0){
            expect(res.body[0].name).to.have.string('delete')
          }
        })
      })

      describe('getCollection - /collections/{collectionId}', function () {
        it('Return a Collection',async function () {
        const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}?projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs&projection=labels`)
          .set('Authorization', `Bearer ${iteration.token}`)
          if (distinct.grant === "none"){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(200)
          expect(res.body.collectionId).to.equal(reference.testCollection.collectionId)
          const regex  = new RegExp(reference.testCollection.name)
          expect(res.body.name).to.match(regex)
      
          for(const grant of res.body.grants){
            const userIds = reference.testCollection.grantsProjected.map(grant => grant.user.userId)
            expect(userIds).to.include(grant.user.userId)
          }

          // assets projection
          expect(res.body.assets).to.have.lengthOf(distinct.assetIds.length)
          for(const asset of res.body.assets){
            expect(reference.testCollection.assetIds).to.include(asset.assetId)
          }          
          expect(res.body.statistics.assetCount).to.eql(distinct.assetIds.length)

          //owner
          expect(res.body.owners).to.have.lengthOf(reference.testCollection.owners.length)
          for(const owner of res.body.owners){
            expect(reference.testCollection.owners).to.include(owner.userId)
          }

          //stigs
          expect(res.body.stigs).to.have.lengthOf(distinct.validStigs.length)
          for(const stig of res.body.stigs){
            expect(distinct.validStigs).to.include(stig.benchmarkId)
          }
          expect(res.body.statistics).to.have.property('grantCount', distinct.grantCnt)
            
        })
      })

      describe('getChecklistByCollectionStig - /collections/{collectionId}/checklists/{benchmarkId}/{revisionStr}', function () {
        it('Return the Checklist for the supplied Collection and STIG-latest',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/checklists/${reference.benchmark}/${'latest'}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(reference.checklistLength)
        })
        it('Return the Checklist for the supplied Collection and STIG-revStr',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/checklists/${reference.benchmark}/${reference.revisionStr}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(reference.checklistLength)
        })
      })

      // needs some projection work
      describe('getFindingsByCollection - /collections/{collectionId}/findings', function () {
        
        it('Return the Findings for the specified Collection by ruleId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/findings?aggregator=cci&acceptedOnly=false&projection=assets&projection=groups&projection=rules&projection=stigs&projection=ccis`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)

            expect(res.body).to.have.lengthOf(distinct.findings.findingsCnt)

            // assets projection
            for(const finding of res.body){
                expect(finding.assetCount).to.equal(finding.assets.length)
                for(const asset of finding.assets){
                    expect(distinct.assetIds).to.include(asset.assetId)
                }
            }
            // groups projection
            expect(res.body[0].groups).to.be.an('array').of.length(1)

            // rules projection
            expect(res.body[0].rules).to.be.an('array').of.length(1)
            
            // stigs projection
            expect(res.body[0].stigs).to.be.an('array').of.length(1)
            expect(res.body[0].stigs[0].ruleCount).to.equal(81)
            expect(res.body[0].stigs[0].benchmarkId).to.equal(reference.benchmark)
            expect(res.body[0].stigs[0].revisionStr).to.equal(reference.revisionStr)

            // ccis projection
            expect(res.body[0].ccis).to.be.an('array').of.length(1)
        })

        it('Return the Findings for the specified Collection by groupId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/findings?aggregator=groupId&acceptedOnly=false&projection=assets`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)

            expect(res.body).to.have.lengthOf(distinct.findings.findingsByGroupCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(finding.assets.length)
              for(const asset of finding.assets){
                  expect(distinct.assetIds).to.include(asset.assetId)
              }
            }
        })

        it('Return the Findings for the specified Collection by cci',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/findings?aggregator=cci&acceptedOnly=false&projection=assets`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)

            expect(res.body).to.have.lengthOf(distinct.findings.findingsByCciCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(finding.assets.length)
              for(const asset of finding.assets){
                  expect(distinct.assetIds).to.include(asset.assetId)
              }
            }
        })

        it('Return the Findings for the specified Collection for benchmarkId x ruleId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/findings?aggregator=ruleId&acceptedOnly=false&benchmarkId=${reference.benchmark}&projection=assets`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)

            expect(res.body).to.be.an('array').of.length(distinct.findings.findingsByRuleForBenchmarkCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(finding.assets.length)
              for(const asset of finding.assets){
                  expect(distinct.assetIds).to.include(asset.assetId)
              }
            }
        })

        it('Return the Findings for the specified Collection for asset x ruleId Copy',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/findings?aggregator=ruleId&acceptedOnly=false&assetId=${reference.testAsset.assetId}&projection=assets`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)

            expect(res.body).to.have.lengthOf(distinct.findings.findingsByRuleForAssetCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(1)
              expect(finding.assets[0].assetId).to.equal(reference.testAsset.assetId)
            }
        })
      })

      describe('getStigAssetsByCollectionUser - /collections/{collectionId}/grants/{userId}/access', function () {

        it('Return stig-asset grants for a lvl1 iteration in this collection.',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.grantCheckUserId}/access`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
          }

            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(2)
            const regex = new RegExp("asset")
            for (const stigAssetGrant of res.body) {
              expect(stigAssetGrant.asset.name).to.match(regex)
              expect(stigAssetGrant.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
              expect(stigAssetGrant.asset.assetId).to.be.oneOf(distinct.assetIds)
            }
        })
      })
    
      describe('getCollectionLabels - /collections/{collectionId}/labels', function () {

        it('Labels for the specified Collection',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/labels`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(reference.testCollection.labels.length)
            for(const label of res.body){
              expect(reference.testCollection.labels).to.include(label.labelId)
              if (label.name == reference.testCollection.fullLabelName){
                  expect(label.uses).to.equal(distinct.fullLabelUses)
                }
              if (label.name == reference.testCollection.lvl1LabelName){
                  expect(label.uses).to.equal(distinct.lvl1LabelUses)
              }
              
            }

        })
      })

      describe('getCollectionLabelById - /collections/{collectionId}/labels/{labelId}', function () {
        it('Collection label',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/labels/${reference.testCollection.fullLabel}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body.labelId).to.equal(reference.testCollection.fullLabel)
            expect(res.body.uses).to.equal(distinct.fullLabelUses)

            expect(res.body.name).to.equal(reference.testCollection.fullLabelName)
        })
        it("should return SmError.NotFoundError because the label does not exist",async function () {

          const randomUUID = uuidv4()

          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/labels/${randomUUID}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(404)
            expect(res.body.error).to.equal("Resource not found.")
        })
      })

      describe('getCollectionMetadata - /collections/{collectionId}/metadata', function () {
        it('Metadata for the specified Collection',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/metadata`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }                
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
          }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body[reference.testCollection.collectionMetadataKey]).to.equal(reference.testCollection.collectionMetadataValue)
        })
      })

      describe('getCollectionMetadataKeys - /collections/{collectionId}/metadata/keys', function () {

        it('Return the Metadata KEYS for a Collection',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/metadata/keys?`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(reference.testCollection.allMetadata.length)
            const keys = reference.testCollection.allMetadata.map(meta => meta.key)
            for(const key of res.body){
              expect(keys).to.include(key)
            }
        })
        it('should return empty 200 reponse, collection does not have metadata',async function () {
          
          const collectionNoMetadata = await utils.createTempCollection( {
            name: 'temoCollection' + Math.floor(Math.random() * 1000),
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
            metadata: {},
            grants: [
              {
                userId: '1',
                accessLevel: 4
              },
              {
                userId: '85',
                accessLevel: 1
              },
              {
                userId: '21',
                accessLevel: 2
              },
              {
                userId: '44',
                accessLevel: 3
              },
              {
                userId: '45',
                accessLevel: 4
              }
            ],
            labels: [
              {
                name: 'TEST',
                description: 'Collection label description',
                color: 'ffffff'
              }
            ]
          })
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${collectionNoMetadata.data.collectionId}/metadata/keys`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              utils.deleteCollection(collectionNoMetadata.data.collectionId)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              utils.deleteCollection(collectionNoMetadata.data.collectionId)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(0)
            utils.deleteCollection(collectionNoMetadata.data.collectionId)
         })
      })

      describe('getCollectionMetadataValue - /collections/{collectionId}/metadata/keys/{key}', function () {

        it('Return the Metadata VALUE for a Collection metadata KEY',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/metadata/keys/${reference.testCollection.collectionMetadataKey}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.equal(reference.testCollection.collectionMetadataValue)
        })
        it('should throw SmError.NotFoundError because the collection does not contain the key',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/metadata/keys/trashkey`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(404)
            expect(res.body.error).to.equal("Resource not found.")
            expect(res.body.detail).to.equal("metadata key not found")
        })
      })

      describe('getPoamByCollection - /collections/{collectionId}/poam', function () {

        it('Return a POAM-like spreadsheet aggregated by groupId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/poam?aggregator=groupId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&acceptedOnly=true`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
        })

        it('Return a POAM-like spreadsheet aggregated by ruleId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/poam?aggregator=ruleId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&acceptedOnly=true`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
        })

        it('Return an EMASS formatted POAM-like spreadsheet aggregated by groupId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/poam?format=EMASS&aggregator=groupId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&acceptedOnly=true&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
        })

        it('Return an EMASS formatted POAM-like spreadsheet aggregated by ruleId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/poam?format=EMASS&aggregator=ruleId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
        })

        it('Return an MCCAST formatted POAM-like spreadsheet aggregated by groupId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/poam?format=MCCAST&aggregator=groupId&date=01%2F01%2F1970&office=MyOffice&status=Started&acceptedOnly=true&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
        })
  
        it('Return an MCCAST formatted POAM-like spreadsheet aggregated by ruleId',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/poam?format=MCCAST&aggregator=ruleId&date=01%2F01%2F1970&office=MyOffice&status=Started&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
        })
      })

      describe('getReviewHistoryByCollection - /collections/{collectionId}/review-history', function () {

        it('History records - no query params',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)

            for(asset of res.body){
              if(asset.assetId === reference.testCollection.reviewHistory.assetId){
                expect(asset.reviewHistories).to.be.an('array').of.length(reference.testCollection.reviewHistory.reviewHistoryRuleCnt)
                for(const history of asset.reviewHistories){
                  if(history.ruleId === reference.testCollection.reviewHistory.ruleId){
                    expect(history.history).to.be.an('array').of.length(reference.testCollection.reviewHistory.reviewHistoryRuleCnt)
                    for(const record of history.history){
                      expect(record.result).to.be.equal('pass')
                    }
                  }
                }
              }
            }
        })

        it('History records - asset only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history?assetId=${reference.testCollection.reviewHistory.assetId}`)
            .set('Authorization', `Bearer ${iteration.token}`)

            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            //requesting one assets history
            expect(res.body).to.be.an('array').of.length(1)
            for(asset of res.body){
              expect(asset.assetId).to.equal(reference.testCollection.reviewHistory.assetId)
              expect(asset.reviewHistories).to.be.an('array').of.length(reference.testCollection.reviewHistory.rulesWithHistoryCnt)
              for(const history of asset.reviewHistories){
                if(history.ruleId === reference.testCollection.reviewHistory.ruleId){
                  expect(history.history).to.be.an('array').of.length(reference.testCollection.reviewHistory.reviewHistoryRuleCnt)
                  for(const record of history.history){
                    expect(record.result).to.be.equal('pass')
                  }
                }
              }
          }
        })

        it('History records - endDate only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history?endDate=${reference.testCollection.reviewHistory.endDate}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(asset of res.body){
              for(const history of asset.reviewHistories){
                expect(history.history).to.be.an('array').of.length(2)
                for(const record of history.history){
                  expect(Date.parse(record.ts)).to.be.below(Date.parse(reference.testCollection.reviewHistory.endDate))
                }
              }
            }
        })

        it('History records - startDate only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history?startDate=${reference.testCollection.reviewHistory.startDate}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(asset of res.body){
              for(const history of asset.reviewHistories){
                for(const record of history.history){
                  expect(Date.parse(record.ts)).to.be.above(Date.parse(reference.testCollection.reviewHistory.startDate))
                }
              }
            }
        })

        it('History records - rule only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history?ruleId=${reference.testCollection.reviewHistory.ruleId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(asset of res.body){
              for(const history of asset.reviewHistories){
                expect(history.ruleId).to.equal(reference.testCollection.reviewHistory.ruleId)
              }
            }
        })

        it('History records - start and end dates',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history?startDate=${reference.testCollection.reviewHistory.startDate}&endDate=${reference.testCollection.reviewHistory.endDate}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(asset of res.body){
              for(const history of asset.reviewHistories){
                for(const record of history.history){
                  expect(Date.parse(record.ts)).to.be.above(Date.parse(reference.testCollection.reviewHistory.startDate))
                  expect(Date.parse(record.ts)).to.be.below(Date.parse(reference.testCollection.reviewHistory.endDate))
                }
              }
            }
        })

        it('History records - status only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history?status=${reference.testCollection.reviewHistory.status}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(asset of res.body){
              for(const history of asset.reviewHistories){
                for(const record of history.history){
                  expect(record.status.label).to.equal(reference.testCollection.reviewHistory.status)
                }
              }
            }
        })

        it('History records - all params',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history?status=${reference.testCollection.reviewHistory.status}&assetId=${reference.testCollection.reviewHistory.assetId}&ruleId=${reference.testCollection.reviewHistory.ruleId}&startDate=${reference.testCollection.reviewHistory.startDate}&endDate=${reference.testCollection.reviewHistory.endDate}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(1)
            //asset
            //expect just one item in response array
            expect(res.body[0].assetId).to.equal(reference.testCollection.reviewHistory.assetId)
            for(const history of res.body[0].reviewHistories){
              //rule 
              expect(history.ruleId).to.equal(reference.testCollection.reviewHistory.ruleId)
              for(const record of history.history){
                // start/end date
                expect(Date.parse(record.ts)).to.be.above(Date.parse(reference.testCollection.reviewHistory.startDate))
                expect(Date.parse(record.ts)).to.be.below(Date.parse(reference.testCollection.reviewHistory.endDate))
                // status
                expect(record.status.label).to.equal(reference.testCollection.reviewHistory.status)
              }
            }
        })
      })
      
      describe('getReviewHistoryStatsByCollection - /collections/{collectionId}/review-history/stats', function () {

        it('History stats - no query params',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistoryTotalEntryCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - startDate only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?startDate=${reference.testCollection.reviewHistory.startDate}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistoryTotalEntryCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - startDate - Asset Projection',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?startDate=${reference.testCollection.reviewHistory.startDate}&projection=asset`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }

            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistoryTotalEntryCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
            expect(res.body.assetHistoryEntryCounts.length).to.eql(reference.testCollection.reviewHistory.reviewHistory_startDateCnt)
            let totalHistoryEntries = 0
            for(const asset of res.body.assetHistoryEntryCounts){
              expect(distinct.assetIds).to.include(asset.assetId)
              totalHistoryEntries += asset.historyEntryCount
            }
            expect(reference.testCollection.reviewHistory.reviewHistoryTotalEntryCnt).to.equal(res.body.collectionHistoryEntryCount)
        })

        it('History stats - endDate only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?endDate=${reference.testCollection.reviewHistory.endDate}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_endDateCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - start and end dates',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?endDate=${reference.testCollection.reviewHistory.endDate}&startDate=${reference.testCollection.reviewHistory.startDate}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_startAndEndDateCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - asset only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?assetId=${reference.testCollection.reviewHistory.assetId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_testAssetCnt)
        })
        it('History stats - rule only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?ruleId=${reference.testCollection.reviewHistory.ruleId}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_entriesByRuleIdCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:30:38.000Z"))
        })

        it('History stats - status only',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?status=${reference.testCollection.reviewHistory.status}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }

            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_byStatusCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - all params',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/review-history/stats?endDate=${reference.testCollection.reviewHistory.endDate}&startDate=${reference.testCollection.reviewHistory.startDate}&assetId=${reference.testCollection.reviewHistory.assetId}&status=${reference.testCollection.reviewHistory.status}&ruleId=${reference.testCollection.reviewHistory.ruleId}&projection=asset`)
            .set('Authorization', `Bearer ${iteration.token}`)
            
            expect(res).to.have.status(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            //expect just one item in response array
            expect(res.body.collectionHistoryEntryCount).to.equal(1)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T23:37:45.000Z"))
            expect(res.body.assetHistoryEntryCounts.length).to.eql(1)
        })
      })

      describe('getStigsByCollection - /collections/{collectionId}/stigs', function () {

        it('Return the STIGs mapped in the specified Collection',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/stigs`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(distinct.validStigs.length)
            for(const stig of res.body){
              expect(distinct.validStigs).to.include(stig.benchmarkId)
              expect(stig.revisionPinned).to.equal(false)
              if(stig.benchmarkId === reference.benchmark){
                expect(stig.revisionStr).to.equal(reference.revisionStr)
                expect(stig.ruleCount).to.equal(reference.checklistLength)
              }
            }
        })

        it('Return the STIGs mapped in the specified Collection - label',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/stigs?labelId=${reference.testCollection.fullLabel}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)

            expect(res.body).to.be.an('array').of.length(distinct.fullLabelUses)

            for(const stig of res.body){
              expect(distinct.validStigs).to.include(stig.benchmarkId)
              //expect just 1 asset with this label
              expect(stig.assetCount).to.equal(distinct.fullLabelUses)
              if(stig.benchmarkId === reference.benchmark){
                expect(stig.revisionStr).to.equal(reference.revisionStr)
                expect(stig.ruleCount).to.equal(reference.checklistLength)
              }
            }
        })

        it('Return the STIGs mapped in the specified Collection - asset projection',async function () {
          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/stigs?projection=assets`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(distinct.validStigs.length)
            for(const stig of res.body){
              expect(distinct.validStigs).to.include(stig.benchmarkId)
              const regex = new RegExp("asset")
              if(stig.benchmarkId === reference.benchmark){
                expect(stig.revisionStr).to.equal(reference.revisionStr)
                expect(stig.ruleCount).to.equal(reference.checklistLength)
              }
              for(const asset of stig.assets){
                expect(distinct.assetIds).to.include(asset.assetId)
                expect(asset.name).to.match(regex)
              }
            }
        })
        it("return the stigs mapped to test collection label names predicate",async function () {

          const res = await chai.request(config.baseUrl)
            .get(`/collections/${reference.testCollection.collectionId}/stigs?labelName=${reference.testCollection.fullLabelName}`)
            .set('Authorization', `Bearer ${iteration.token}`)
            if (distinct.grant === "none"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array').of.length(distinct.fullLabelUses)

            for(const stig of res.body){
              expect(distinct.validStigs).to.include(stig.benchmarkId)
              //expect just 1 asset with this label
              expect(stig.assetCount).to.equal(distinct.fullLabelUses)
              if(stig.benchmarkId === reference.benchmark){
                expect(stig.revisionStr).to.equal(reference.revisionStr)
                expect(stig.ruleCount).to.equal(reference.checklistLength)
              }
            }
          })
          it("return the stigs mapped to test colleciton label match = null",async function () {
            const res = await chai.request(config.baseUrl)
              .get(`/collections/${reference.testCollection.collectionId}/stigs?labelName=null`)
              .set('Authorization', `Bearer ${iteration.token}`)
              if (distinct.grant === "none"){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(200)
              expect(res.body).to.be.an('array').of.length(0)
          })
      })

      describe('getStigByCollection - /collections/{collectionId}/stigs/{benchmarkId}', function () {

            it('Return Pinned Revision for this STIG',async function () {
              const res = await chai.request(config.baseUrl)
                .get(`/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}`)
                .set('Authorization', `Bearer ${iteration.token}`)
                if (distinct.grant === "none"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(200)
                expect(res.body.benchmarkId).to.equal(reference.benchmark)
                expect(res.body.revisionStr).to.equal(reference.revisionStr)
                expect(res.body.revisionPinned).to.equal(false)
                expect(res.body.assetCount).to.eql(distinct.testBenchmarkAssignedCount)
            })

            it('Should return 204, no stig available (this probably needs to be 404? idk',async function () {
              const res = await chai.request(config.baseUrl)
                .get(`/collections/${reference.testCollection.collectionId}/stigs/notastig`)
                .set('Authorization', `Bearer ${iteration.token}`)
                if (distinct.grant === "none"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(204)
            })

            it('Return the info about the specified STIG from the specified Collection - asset projection',async function () {
              const res = await chai.request(config.baseUrl)
                .get(`/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}?projection=assets`)
                .set('Authorization', `Bearer ${iteration.token}`)
                if (distinct.grant === "none"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(200)
                expect(res.body.benchmarkId).to.equal(reference.benchmark)
                expect(res.body.revisionStr).to.equal(reference.revisionStr)
                expect(res.body.revisionPinned).to.equal(false)
                const regex = new RegExp("asset")
                for(const asset of res.body.assets){
                  expect(distinct.assetIds).to.include(asset.assetId)
                  expect(asset.name).to.match(regex)
                }
            })
      })
    })
  }
})


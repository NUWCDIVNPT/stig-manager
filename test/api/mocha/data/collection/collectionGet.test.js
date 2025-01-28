
import { v4 as uuidv4 } from 'uuid'
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expectations} from './expectations.js'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import {use, expect} from 'chai'
use(deepEqualInAnyOrder)

describe('GET - Collection', function () {

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
    
      describe('getCollections - /collections', function () {
        if (iteration.name === 'stigmanadmin' ){

          it('Return Collections accessible to the requester No Filters - elevated stigmanadmin only', async function () {

            const res = await utils.executeRequest(`${config.baseUrl}/collections?projection=owners&projection=statistics&elevate=true`, 'GET', iteration.token)
            
            expect(res.status).to.eql(200)
            // expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(distinct.collectionCountElevated)
            //check statistics projection
            const testCollection = res.body.find(collection => collection.collectionId === reference.testCollection.collectionId)
            const testCollectionOwnerArray = testCollection.owners.map(owner => owner.userId)

            expect(testCollectionOwnerArray, "proper owners").to.have.members(reference.testCollection.owners)
            expect(testCollection.statistics.assetCount, "asset count").to.equal(distinct.assetIds.length)
            expect(testCollection.statistics.checklistCount, "checklist count").to.equal(distinct.checklistCnt)
          })
        }

        it('Return a list of Collections accessible to the requester No Filters no elevate!',async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections?projection=owners&projection=statistics`, 'GET', iteration.token)
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array')
            expect(res.body).to.have.lengthOf(distinct.collectionCount)
            for(const collection of res.body){
              expect(collection.collectionId).to.be.oneOf(distinct.collectionIdsAccess)
            }
        })
        it('Return a list of Collections accessible to the requester METADATA',async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections?metadata=${reference.testCollection.collectionMetadataKey}%3A${reference.testCollection.collectionMetadataValue}`, 'GET', iteration.token)
            expect(res.status).to.eql(200)
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
              name: 'tempCollection' +  utils.getUUIDSubString(),
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
                }
              ],
              labels: [
              ]
            })
          
          const res = await utils.executeRequest(`${config.baseUrl}/collections?metadata=testKey%3Atest%3Avalue`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('array')
          if(iteration.name !== 'stigmanadmin'){
            expect(res.body).to.have.lengthOf(0)
            return
          }
          expect(res.body).to.have.lengthOf(1)
          expect(res.body[0].collectionId).to.equal(tempCollectionWithMetadata.collectionId)
        })
        it('Return a list of Collections accessible to the requester NAME exact',async function () {
        const res = await utils.executeRequest(`${config.baseUrl}/collections?name=${reference.testCollection.name}&name-match=exact`, 'GET', iteration.token)
        expect(res.status).to.eql(200)
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
        const res = await utils.executeRequest(`${config.baseUrl}/collections?name=${'Collection'}&name-match=startsWith`, 'GET', iteration.token)
        expect(res.status).to.eql(200)
        
        expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionStartMatchCnt)
        if (distinct.collectionMatch.collectionContainsMatchCnt == 0) {
          return
        }

        for(const collection of res.body){
            expect(collection.name).to.have.string('Collection')
        }
        })
        it('Return a list of Collections accessible to the requester NAME ends With',async function () {
        const res = await utils.executeRequest(`${config.baseUrl}/collections?name=${'X'}&name-match=endsWith`, 'GET', iteration.token)
        expect(res.status).to.eql(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionEndMatchCnt)
        if (distinct.collectionMatch.collectionContainsMatchCnt == 0) {
          return
        }
        expect(res.body[0].name).to.have.string('X')
        })
        it('Return a list of Collections accessible to the requester NAME contains elevated',async function () {
        const res = await utils.executeRequest(`${config.baseUrl}/collections?name=${'delete'}&name-match=contains&elevate=true`, 'GET', iteration.token)
        if(iteration.name !== 'stigmanadmin'){
          expect(res.status).to.eql(403)
          return
        } 
        expect(res.status).to.eql(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionDeleteMatchCntElevated)
        expect(res.body[0].name).to.have.string('delete')
        })
        it('Return a list of Collections accessible to the requester NAME contains no elevate',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections?name=${'delete'}&name-match=contains`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
          expect(res.body).to.have.lengthOf(distinct.collectionMatch.collectionDeleteMatchCnt)
          if (distinct.collectionMatch.collectionDeleteMatchCnt > 0){
            expect(res.body[0].name).to.have.string('delete')
          }
        })
        it("return collections with stats projection, no elevate",async function () {
          const res =  await utils.executeRequest(`${config.baseUrl}/collections?projection=statistics`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
          for(const collection of res.body){
            if(collection.collectionId === reference.testCollection.collectionId){
              expect(collection.statistics.assetCount).to.equal(distinct.assetIds.length)
            }
          }
        })
      })

      describe('getCollection - /collections/{collectionId}', function () {
        it('Return a Collection',async function () { 
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}?projection=assets&projection=grants&projection=owners&projection=users&projection=statistics&projection=stigs&projection=labels`, 'GET', iteration.token)
          if (distinct.grant === "none"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.collectionId).to.equal(reference.testCollection.collectionId)
          const regex  = new RegExp(reference.testCollection.name)
          expect(res.body.name).to.match(regex)
          
          expect(res.body.grants).to.have.lengthOf(reference.testCollection.grantsProjected.length)
          for(const grant of res.body.grants){
            const userIds = reference.testCollection.grantsProjected
            .filter(grant => grant.user)
            .map(grant => grant.user.userId);
          
            if (grant.user) {
              expect(userIds).to.include(grant.user.userId);
            }
            else if (grant.userGroup) {
              const groupIds = reference.testCollection.grantsProjected
                .filter(grant => grant.userGroup)
                .map(grant => grant.userGroup.userGroupId);
          
              expect(groupIds).to.include(grant.userGroup.userGroupId);
            }
          }


          // assets projection
          expect(res.body.assets).to.have.lengthOf(distinct.assetIds.length)
          for(const asset of res.body.assets){
            expect(reference.testCollection.assetIds).to.include(asset.assetId)
            expect(reference.testCollection.assetsProjected).to.deep.include(asset)
          }       
          //stats
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
        })
      })

      describe('getChecklistByCollectionStig - /collections/{collectionId}/checklists/{benchmarkId}/{revisionStr}', function () {
        it('Return the Checklist for the supplied Collection and STIG-latest',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/checklists/${reference.benchmark}/latest`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(reference.checklistLength)
        })
        it('Return the Checklist for the supplied Collection and STIG-revStr',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/checklists/${reference.benchmark}/${reference.revisionStr}`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(reference.checklistLength)
        })
      })

      // needs some projection work
      describe('getFindingsByCollection - /collections/{collectionId}/findings', function () {
        
        it('Return the Findings for the specified Collection by ruleId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/findings?aggregator=cci&acceptedOnly=false&projection=assets&projection=groups&projection=rules&projection=stigs&projection=ccis`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)

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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/findings?aggregator=groupId&acceptedOnly=false&projection=assets`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)

            expect(res.body).to.have.lengthOf(distinct.findings.findingsByGroupCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(finding.assets.length)
              for(const asset of finding.assets){
                  expect(distinct.assetIds).to.include(asset.assetId)
              }
            }
        })

        it('Return the Findings for the specified Collection by cci',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/findings?aggregator=cci&acceptedOnly=false&projection=assets`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)

            expect(res.body).to.have.lengthOf(distinct.findings.findingsByCciCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(finding.assets.length)
              for(const asset of finding.assets){
                  expect(distinct.assetIds).to.include(asset.assetId)
              }
            }
        })

        it('Return the Findings for the specified Collection for benchmarkId x ruleId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/findings?aggregator=ruleId&acceptedOnly=false&benchmarkId=${reference.benchmark}&projection=assets`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)

            expect(res.body).to.be.an('array').of.length(distinct.findings.findingsByRuleForBenchmarkCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(finding.assets.length)
              for(const asset of finding.assets){
                  expect(distinct.assetIds).to.include(asset.assetId)
              }
            }
        })

        it('Return the Findings for the specified Collection for asset x ruleId Copy',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/findings?aggregator=ruleId&acceptedOnly=false&assetId=${reference.testAsset.assetId}&projection=assets`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)

            expect(res.body).to.have.lengthOf(distinct.findings.findingsByRuleForAssetCnt)

            for(const finding of res.body){
              expect(finding.assetCount).to.equal(1)
              expect(finding.assets[0].assetId).to.equal(reference.testAsset.assetId)
            }
        })
      })

      describe('getEffectiveAclByCollectionUser - /collections/{collectionId}/users/{userId}/effective-acl', function () {

        it("should return the effective ACL for the user in the collection users < manage will get rejected",async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${iteration.userId}/effective-acl`, 'GET', iteration.token)
            if (distinct.grant === "none" || distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.deep.equalInAnyOrder(distinct.acl)
        })

        it("should return the effective ACL for the user in the collection users uses only admin token",async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${iteration.userId}/effective-acl`, 'GET', iterations[0].token)
            
            if(iteration.name === 'collectioncreator'){
              expect(res.status).to.eql(422)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.deep.equalInAnyOrder(distinct.acl)
        })
        it("should return SmError.UnprocessableError because the user has no direct grant in the collection",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${"1234321"}/effective-acl`, 'GET', iteration.token)
            if (distinct.grant === "none" || distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(422)
            expect(res.body.error).to.equal("Unprocessable Entity.")
        })
      })
  
      describe('getCollectionLabels - /collections/{collectionId}/labels', function () {

        it('Labels for the specified Collection',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${reference.testCollection.fullLabel}`, 'GET', iteration.token)
         /* The above JavaScript code snippet is performing the following actions: */
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body.labelId).to.equal(reference.testCollection.fullLabel)
            expect(res.body.uses).to.equal(distinct.fullLabelUses)

            expect(res.body.name).to.equal(reference.testCollection.fullLabelName)
        })
        it("should return SmError.NotFoundError because the label does not exist",async function () {

          const randomUUID = uuidv4()

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/labels/${randomUUID}`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(404)
            expect(res.body.error).to.equal("Resource not found.")
        })
      })

      describe('getCollectionMetadata - /collections/{collectionId}/metadata', function () {
        it('Metadata for the specified Collection',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metadata`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }                
            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
          }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('object')
            expect(res.body[reference.testCollection.collectionMetadataKey]).to.equal(reference.testCollection.collectionMetadataValue)
        })
      })

      describe('getCollectionMetadataKeys - /collections/{collectionId}/metadata/keys', function () {

        it('Return the Metadata KEYS for a Collection',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metadata/keys?`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(reference.testCollection.allMetadata.length)
            const keys = reference.testCollection.allMetadata.map(meta => meta.key)
            for(const key of res.body){
              expect(keys).to.include(key)
            }
        })
        it('should return empty 200 reponse, collection does not have metadata',async function () {
          
          const collectionNoMetadata = await utils.createTempCollection( {
            name: 'temoCollection' + utils.getUUIDSubString(),
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
                roleId: 4
              },
              {
                userId: '21',
                roleId: 2
              },
              {
                userId: '44',
                roleId: 3
              },
              {
                userId: '45',
                roleId: 4
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionNoMetadata.collectionId}/metadata/keys`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              utils.deleteCollection(collectionNoMetadata.collectionId)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              utils.deleteCollection(collectionNoMetadata.collectionId)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(0)
            utils.deleteCollection(collectionNoMetadata.collectionId)
         })
      })

      describe('getCollectionMetadataValue - /collections/{collectionId}/metadata/keys/{key}', function () {

        it('Return the Metadata VALUE for a Collection metadata KEY',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metadata/keys/${reference.testCollection.collectionMetadataKey}`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.equal(reference.testCollection.collectionMetadataValue)
        })
        it('should throw SmError.NotFoundError because the collection does not contain the key',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/metadata/keys/trashkey`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            if(distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(404)
            expect(res.body.error).to.equal("Resource not found.")
            expect(res.body.detail).to.equal("metadata key not found")
        })
      })

      describe('getPoamByCollection - /collections/{collectionId}/poam', function () {

        it('Return a POAM-like spreadsheet aggregated by groupId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/poam?aggregator=groupId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&acceptedOnly=true`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
        })

        it('Return a POAM-like spreadsheet aggregated by ruleId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/poam?aggregator=ruleId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&acceptedOnly=true`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
        })

        it('Return an EMASS formatted POAM-like spreadsheet aggregated by groupId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/poam?format=EMASS&aggregator=groupId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&acceptedOnly=true&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
        })

        it('Return an EMASS formatted POAM-like spreadsheet aggregated by ruleId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/poam?format=EMASS&aggregator=ruleId&date=01%2F01%2F1970&office=MyOffice&status=Ongoing&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
        })

        it('Return an MCCAST formatted POAM-like spreadsheet aggregated by groupId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/poam?format=MCCAST&aggregator=groupId&date=01%2F01%2F1970&office=MyOffice&status=Started&acceptedOnly=true&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
        })
  
        it('Return an MCCAST formatted POAM-like spreadsheet aggregated by ruleId',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/poam?format=MCCAST&aggregator=ruleId&date=01%2F01%2F1970&office=MyOffice&status=Started&mccastPackageId=PackageID&mccastAuthName=AuthPackageName`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
        })
      })

      describe('getReviewHistoryByCollection - /collections/{collectionId}/review-history', function () {

        it('History records - no query params',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)

            for(const asset of res.body){
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?assetId=${reference.testCollection.reviewHistory.assetId}`, 'GET', iteration.token)

            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            //requesting one assets history
            expect(res.body).to.be.an('array').of.length(1)
            for(const asset of res.body){
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?endDate=${reference.testCollection.reviewHistory.endDate}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(const asset of res.body){
              for(const history of asset.reviewHistories){
                expect(history.history).to.be.an('array').of.length(2)
                for(const record of history.history){
                  expect(Date.parse(record.ts)).to.be.below(Date.parse(reference.testCollection.reviewHistory.endDate))
                }
              }
            }
        })

        it('History records - startDate only',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?startDate=${reference.testCollection.reviewHistory.startDate}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(const asset of res.body){
              for(const history of asset.reviewHistories){
                for(const record of history.history){
                  expect(Date.parse(record.ts)).to.be.above(Date.parse(reference.testCollection.reviewHistory.startDate))
                }
              }
            }
        })

        it('History records - rule only',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?ruleId=${reference.testCollection.reviewHistory.ruleId}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(const asset of res.body){
              for(const history of asset.reviewHistories){
                expect(history.ruleId).to.equal(reference.testCollection.reviewHistory.ruleId)
              }
            }
        })

        it('History records - start and end dates',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?startDate=${reference.testCollection.reviewHistory.startDate}&endDate=${reference.testCollection.reviewHistory.endDate}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(const asset of res.body){
              for(const history of asset.reviewHistories){
                for(const record of history.history){
                  expect(Date.parse(record.ts)).to.be.above(Date.parse(reference.testCollection.reviewHistory.startDate))
                  expect(Date.parse(record.ts)).to.be.below(Date.parse(reference.testCollection.reviewHistory.endDate))
                }
              }
            }
        })

        it('History records - status only',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?status=${reference.testCollection.reviewHistory.status}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body).to.be.an('array').of.length(reference.testCollection.assetsWithHistory.length)
            for(const asset of res.body){
              for(const history of asset.reviewHistories){
                for(const record of history.history){
                  expect(record.status.label).to.equal(reference.testCollection.reviewHistory.status)
                }
              }
            }
        })

        it('History records - all params',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history?status=${reference.testCollection.reviewHistory.status}&assetId=${reference.testCollection.reviewHistory.assetId}&ruleId=${reference.testCollection.reviewHistory.ruleId}&startDate=${reference.testCollection.reviewHistory.startDate}&endDate=${reference.testCollection.reviewHistory.endDate}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistoryTotalEntryCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - startDate only',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?startDate=${reference.testCollection.reviewHistory.startDate}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistoryTotalEntryCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - startDate - Asset Projection',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?startDate=${reference.testCollection.reviewHistory.startDate}&projection=asset`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?endDate=${reference.testCollection.reviewHistory.endDate}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_endDateCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - start and end dates',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?endDate=${reference.testCollection.reviewHistory.endDate}&startDate=${reference.testCollection.reviewHistory.startDate}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_startAndEndDateCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - asset only',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?assetId=${reference.testCollection.reviewHistory.assetId}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_testAssetCnt)
        })
        it('History stats - rule only',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?ruleId=${reference.testCollection.reviewHistory.ruleId}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }
            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_entriesByRuleIdCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:30:38.000Z"))
        })

        it('History stats - status only',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?status=${reference.testCollection.reviewHistory.status}`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
            if (res.status !== 200){
              return
            }

            expect(res.body.collectionHistoryEntryCount).to.equal(reference.testCollection.reviewHistory.reviewHistory_byStatusCnt)
            expect(Date.parse(res.body.oldestHistoryEntryDate)).to.equal(Date.parse("2020-08-11T22:26:50.000Z"))
        })

        it('History stats - all params',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/review-history/stats?endDate=${reference.testCollection.reviewHistory.endDate}&startDate=${reference.testCollection.reviewHistory.startDate}&assetId=${reference.testCollection.reviewHistory.assetId}&status=${reference.testCollection.reviewHistory.status}&ruleId=${reference.testCollection.reviewHistory.ruleId}&projection=asset`, 'GET', iteration.token)
            
            expect(res.status).to.eql(distinct.historyResponseStatus)
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
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
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs?labelId=${reference.testCollection.fullLabel}`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)

            expect(res.body).to.be.an('array').of.length(distinct.fullLabelUses)

            for(const stig of res.body){
              expect(distinct.validStigs).to.include(stig.benchmarkId)
              if(stig.benchmarkId === reference.benchmark){
                expect(stig.assetCount).to.equal(distinct.vpnStigAssetCount)
                expect(stig.revisionStr).to.equal(reference.revisionStr)
                expect(stig.ruleCount).to.equal(reference.checklistLength)
              }
              else{
                expect(stig.assetCount).to.equal(distinct.windowsStigAssetCount)
                expect(stig.ruleCount).to.equal(287)
              }
            }
        })

        it('Return the STIGs mapped in the specified Collection - asset projection',async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs?projection=assets`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
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

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs?labelName=${reference.testCollection.fullLabelName}`, 'GET', iteration.token)
            if (distinct.grant === "none"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(distinct.fullLabelUses)

            for(const stig of res.body){
              expect(distinct.validStigs).to.include(stig.benchmarkId)
              //expect just 1 asset with this label
              if(stig.benchmarkId === reference.benchmark){
                expect(stig.assetCount).to.equal(distinct.vpnStigAssetCount)
                expect(stig.revisionStr).to.equal(reference.revisionStr)
                expect(stig.ruleCount).to.equal(reference.checklistLength)
              }
              else{
                expect(stig.assetCount).to.equal(distinct.windowsStigAssetCount)
                expect(stig.ruleCount).to.equal(287)
              }
            }
          })
          it("return the stigs mapped to test colleciton label match = null",async function () {
            const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs?labelName=null`, 'GET', iteration.token)
              if (distinct.grant === "none"){
                expect(res.status).to.eql(403)
                return
              }
              expect(res.status).to.eql(200)
              expect(res.body).to.be.an('array').of.length(0)
          })
      })

      describe('getStigByCollection - /collections/{collectionId}/stigs/{benchmarkId}', function () {

            it('Return Pinned Revision for this STIG',async function () {
              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}`, 'GET', iteration.token)
                if (distinct.grant === "none"){
                  expect(res.status).to.eql(403)
                  return
                }
                expect(res.status).to.eql(200)
                expect(res.body.benchmarkId).to.equal(reference.benchmark)
                expect(res.body.revisionStr).to.equal(reference.revisionStr)
                expect(res.body.revisionPinned).to.equal(false)
                expect(res.body.assetCount).to.eql(distinct.testBenchmarkAssignedCount)
            })

            it('Should return 204, no stig available (this probably needs to be 404? idk',async function () {
              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/notastig`, 'GET', iteration.token)
                if (distinct.grant === "none"){
                  expect(res.status).to.eql(403)
                  return
                }
                expect(res.status).to.eql(204)
            })

            it('Return the info about the specified STIG from the specified Collection - asset projection',async function () {
              const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${reference.benchmark}?projection=assets`, 'GET', iteration.token)
                if (distinct.grant === "none"){
                  expect(res.status).to.eql(403)
                  return
                }
                expect(res.status).to.eql(200)
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

      // experimental 
      describe('getUnreviewedAssetsByCollection - /collections/{collectionId}/unreviewed/assets', function () {

        it("should return 200 ",async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/unreviewed/assets`, 'GET', iteration.token)
          if (distinct.grant === "none"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
        })
      })

      describe('getUnreviewedRulesByCollection - /collections/{collectionId}/unreviewed/rules', function () {

        it("should return200",async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/unreviewed/rules`, 'GET', iteration.token)
          if (distinct.grant === "none"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
        })
      })

      describe('getGrantsByCollection - /collections/{collectionId}/grants', function () {

        it("should return all grants for the collection",async function () {  
          
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'GET', iteration.token)
            if (distinct.canModifyCollection === false){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(reference.testCollection.grantsProjected.length)
            expect(res.body).to.deep.equalInAnyOrder(reference.testCollection.grantsProjected)
        })
        it("should return all grants for the collection elevated, stigman admin should only pass. ",async function () {  
          
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants?elevate=true`, 'GET', iteration.token)
            if (iteration.name !== "stigmanadmin"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(reference.testCollection.grantsProjected.length)
            expect(res.body).to.deep.equalInAnyOrder(reference.testCollection.grantsProjected)
        })
      })

      describe('getGrantByCollectionGrant - /collections/{collectionId}/grants/{grantId}', function () {

        it("should return grant info for the test group",async function () {
          const res =  await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`, 'GET', iteration.token)
          if (distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.roleId).to.equal(reference.testCollection.testGroup.roleId)
          expect(res.body.grantId).to.equal(reference.testCollection.testGroup.testCollectionGrantId)
          expect(res.body.userGroup.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
          expect(res.body.userGroup.name).to.equal(reference.testCollection.testGroup.name)
        })
        it("should return grant for the test collection admin user (admin burke userId 87)",async function () {
          const res =  await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.adminBurke.testCollectionGrantId}`, 'GET', iteration.token)
          if (distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.roleId).to.equal(reference.adminBurke.testCollectionrole)
          expect(res.body.grantId).to.equal(reference.adminBurke.testCollectionGrantId)
          expect(res.body.user.userId).to.equal(reference.adminBurke.userId)
          expect(res.body.user.username).to.equal(reference.adminBurke.username)
        })

        it("should return grant for the test collection admin user (admin burke userId 87) elevated only stigmanadmin success",async function () {
          const res =  await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.adminBurke.testCollectionGrantId}?elevate=true`, 'GET', iteration.token)
          if (iteration.name !== "stigmanadmin"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.roleId).to.equal(reference.adminBurke.testCollectionrole)
          expect(res.body.grantId).to.equal(reference.adminBurke.testCollectionGrantId)
          expect(res.body.user.userId).to.equal(reference.adminBurke.userId)
          expect(res.body.user.username).to.equal(reference.adminBurke.username)
        })


        
        it("should return an error, there is no such grantId",async function () {
          
          const res =  await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${"12345678"}`, 'GET', iteration.token)
          if (distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(404)
        })
      })

      describe('getAclRulesByCollectionGrant - /collections/{collectionId}/grants/{grantId}/acl', function () {

        it("should return acl for the testGroup",async function () {
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}/acl`, 'GET', iteration.token)
          if (distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.defaultAccess).to.equal(reference.testCollection.testGroup.defaultAccess)
          expect(res.body.acl).to.deep.equalInAnyOrder(reference.testCollection.testGroup.acl) 
        })

        it("should return the ACL for the direct users in the iteration (all using admin token for lvl1 and 2 success",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${iteration.grantId}/acl`, 'GET', iterations[0].token)
          if(iteration.name === "collectioncreator"){
            expect(res.status).to.eql(400)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.defaultAccess).to.equal(distinct.defaultAccess)
          expect(res.body.acl).to.deep.equalInAnyOrder(distinct.aclByGrantId) 

        })

        it("Should throw error collection id is bad",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${"12345678"}/grants/${reference.testCollection.testGroup.testCollectionGrantId}/acl`, 'GET', iteration.token)
          expect(res.status).to.eql(403)
        })

        it("should throw error grantId is bad",async function () {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${"12345678"}/acl`, 'GET', iteration.token)
          if(distinct.canModifyCollection === false){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(404)
        })
      })
    })
  }
})


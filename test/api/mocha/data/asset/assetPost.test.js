const chai = require('chai')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.use(deepEqualInAnyOrder)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils')
const iterations = require('../../iterations.js')
const expectations = require('./expectations.js')
const reference = require('../../referenceData.js')

describe('POST - Asset', function () {
  for (const iteration of iterations) {
    if (expectations[iteration.name] === undefined){
      it(`No expectations for this iteration scenario: ${iteration.name}`, async function () {})
      continue
    }
    describe(`iteration:${iteration.name}`, function () {
      const distinct = expectations[iteration.name]
      describe(`createAsset - /assets`, function () {
        it('Create an Asset (with statusStats and stigs projection', async function () {
          const res = await chai
            .request(config.baseUrl)
            .post('/assets?projection=statusStats&projection=stigs')
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              name: 'TestAsset' + Date.now(),
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelIds: [reference.testCollection.fullLabel],
              metadata: {
                pocName: 'pocName',
                pocEmail: 'pocEmail@example.com',
                pocPhone: '12345',
                reqRar: 'true'
              },
              stigs: reference.testCollection.validStigs
            })
          
            if(!distinct.canModifyCollection){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(201)
            
            expect(res.body.collection.collectionId).to.equal(reference.testCollection.collectionId)
            expect(res.body.name).to.be.a('string')
            expect(res.body.ip).to.equal('1.1.1.1')
            expect(res.body.noncomputing).to.equal(true)
            expect(res.body.labelIds).to.eql([reference.testCollection.fullLabel])
            expect(res.body.metadata.pocName).to.equal('pocName')
            expect(res.body.metadata.pocEmail).to.equal('pocEmail@example.com')
            expect(res.body.stigs).to.be.an('array').of.length(reference.testCollection.validStigs.length)
            expect(res.body).to.have.property('statusStats')
            expect(res.body.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)
            expect(res.body.statusStats.stigCount).to.equal(reference.testAsset.stats.stigCount)
            expect(res.body.statusStats.savedCount).to.equal(0)
            expect(res.body.statusStats.acceptedCount).to.equal(0)
            expect(res.body.statusStats.rejectedCount).to.equal(0)

            for(const stig of res.body.stigs) {
              expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
            }

            const effectedAsset = await utils.getAsset(res.body.assetId)

            expect(effectedAsset.statusStats.ruleCount).to.equal(reference.testAsset.stats.ruleCount)

        })
        it('should fail, duplicate asset name', async function () {

          const res = await chai
            .request(config.baseUrl)
            .post('/assets')
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              name: reference.testAsset.name,
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelIds: [reference.testCollection.fullLabel],
              metadata: {
                pocName: 'pocName',
              },
              stigs: reference.testCollection.validStigs
          })
          if(!distinct.canModifyCollection){
            expect(res).to.have.status(403)
            return
          }
          expect(res).to.have.status(422)
        })
        it('Create an Asset (with stigGrants projection)', async function () {
          const res = await chai
            .request(config.baseUrl)
            .post('/assets?projection=stigGrants')
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              name: 'TestAsset' + Date.now(),
              collectionId: reference.testCollection.collectionId,
              description: 'test',
              ip: '1.1.1.1',
              noncomputing: true,
              labelIds: [reference.testCollection.fullLabel],
              metadata: {
                pocName: 'pocName',
                pocEmail: 'pocEmail@example.com',
                pocPhone: '12345',
                reqRar: 'true'
              },
              stigs: reference.testCollection.validStigs
            })
          
          if(!distinct.canModifyCollection){
            expect(res).to.have.status(403)
            return
          }
          
          expect(res).to.have.status(201)
           
          for(const stig of res.body.stigGrants) {
            expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
          }
          const effectedAsset = await utils.getAsset(res.body.assetId)
          for(const stig of effectedAsset.stigGrants) {
            expect(stig.benchmarkId).to.be.oneOf(reference.testCollection.validStigs)
          }
        })
      })
    })
  }
})

function assetGetToPost (assetGet) {
  // extract the transformed and unposted properties
  const { assetId, collection, stigs, mac, fqdn, ...assetPost } = assetGet

  // add transformed properties to the derived post
  assetPost.collectionId = collection.collectionId
  assetPost.stigs = stigsGetToPost(stigs)

  // the derived post object
  return assetPost
}

function stigsGetToPost (stigsGetArray) {
  const stigsPostArray = []
  for (const stig of stigsGetArray) {
    stigsPostArray.push(stig.benchmarkId)
  }
  return stigsPostArray
}

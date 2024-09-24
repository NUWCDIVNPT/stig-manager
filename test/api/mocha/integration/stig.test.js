const chai = require("chai")
const chaiHttp = require("chai-http")
chai.use(chaiHttp)
const expect = chai.expect
const fs = require("fs")
const path = require("path")
const config = require("../testConfig.json")
const utils = require("../utils/testUtils")
const reference = require("../referenceData.js")

const user = {
  name: "stigmanadmin",
  grant: "Owner",
  userId: "1",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe(`POST - importBenchmark - /stigs`, () => {

  describe('Review Key Change', () => {

    before(async function () {
      this.timeout(4000)
      await utils.uploadTestStigs()
      await utils.loadAppData()
      await utils.uploadTestStig('U_VPN_SRG_V2R3_Manual-xccdf-reviewKeyChange.xml')
      // await utils.createDisabledCollectionsandAssets()
    })

    after(async function () {
      this.timeout(4000)
      await utils.deleteStigByRevision("VPN_SRG_OTHER", "V2R3")

    })
    it('Import a new STIG - with new RuleID matching old content', async function () {
      
        const directoryPath = path.join(__dirname, '../../../api/form-data-files/')
        const testStigfile = reference.reviewKeyChangeFile
        const filePath = path.join(directoryPath, testStigfile)
   
        const res = await chai.request(config.baseUrl)
        .post('/stigs?elevate=true&clobber=true')
        .set('Authorization', `Bearer ${user.token}`)
        .set('Content-Type', `multipart/form-data`)
        .attach('importFile', fs.readFileSync(filePath), testStigfile)
        expect(res).to.have.status(200)
    })
    it('Return the Review for an Asset and Rule - rule matches on stigId/checkContent', async function () {

        const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106179r1_yyyy'}?projection=stigs&projection=rule`)
          .set('Authorization', `Bearer ${user.token}`)
        expect(res).to.have.status(200)
        expect(res.body.stigs).to.not.be.null
        expect(res.body.rule).to.exist
        expect(res.body.ruleId).to.eql(reference.ruleId)
        expect(res.body.ruleIds).to.include("SV-106179r1_yyyy");
        expect(res.body.ruleIds).to.include(reference.ruleId)
        const regex = new RegExp(reference.reviewMatchString)
        expect(res.body.detail).to.match(regex)
    })
    it('PUT Review: stigs and rule projections Copy', async () => {

        const putBody = {
            "result": "pass",
            "detail": "test\nvisible to lvl1",
            "comment": "sure",
            "autoResult": false,
            "status": "submitted"
        }

        const res = await chai.request(config.baseUrl)
            .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106179r1_yyyy'}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send(putBody)

        expect(res).to.have.status(403)
    })    
    it('Set all properties of an Asset - assign new STIG', async function () {
        const res = await chai.request(config.baseUrl)
          .put(`/assets/${reference.testAsset.assetId}`)
          .set('Authorization', 'Bearer ' + user.token)
          .send({
            "name": 'Collection_X_lvl1_asset-1',
            "collectionId": reference.testCollection.collectionId,
            "description": "test desc",
            "ip": "1.1.1.1",
            "noncomputing": true,
            "metadata": {
                "pocName": "poc2Put",
                "pocEmail": "pocEmailPut@email.com",
                "pocPhone": "12342",
                "reqRar": "true"
            },
            "stigs": [
                "VPN_SRG_TEST",
                "VPN_SRG_OTHER",
                "Windows_10_STIG_TEST",
                "RHEL_7_STIG_TEST"
            ]
        })
        expect(res).to.have.status(200)
    })
    it('PUT Review: stigs and rule projections- put review to alternate ruleId', async function () {

        const reqData = {
            "result": "pass",
            "detail": "test\nvisible to lvl1",
            "comment": "sure",
            "autoResult": false,
            "status": "submitted"
        }
        const respData = await chai.request(config.baseUrl)
          .put(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106179r1_yyyy'}?projection=stigs&projection=rule`)
          .set('Authorization', `Bearer ${user.token}`)
          .send(reqData)

          const expectedReview = {
            assetId: "42",
            assetName: "Collection_X_lvl1_asset-1",
            assetLabelIds: [
                  "755b8a28-9a68-11ec-b1bc-0242ac110002",
                  "5130dc84-9a68-11ec-b1bc-0242ac110002"      
            ],
            ruleId: "SV-106179r1_yyyy",
            ruleIds: [
              "SV-106179r1_rule",
              "SV-106179r1_yyyy"
              ],
            result: reqData.result,
            resultEngine: null,
            detail: reqData.detail,
            autoResult: reqData.autoResult,
            comment: reqData.comment,
            userId: user.userId,
            username: user.name,
            ts: respData.body.ts,
            touchTs: respData.body.touchTs,
            status: {
                ts: respData.body.status.ts,
                text: null,
                user: {
                    userId: user.userId,
                    username: user.name
                },
                label: reqData.status
            },
            stigs: [        
                {
                      isDefault: true,
                      ruleCount: 2,
                      benchmarkId: "VPN_SRG_OTHER",
                      revisionStr: "V2R3",
                      benchmarkDate: "2021-07-19",
                      revisionPinned: false
                  }
              ],
            rule: {
              title: "This rule title has been replaced.",
              ruleId: "SV-106179r1_yyyy",
              version: "SRG-NET-000019-VPN-000040",
              severity: "medium"
            }
          }

        expect(respData).to.have.status(200)
        expect(respData.body).to.deep.eql(expectedReview)
    })
    it('Return the Review for an Asset and Rule - rule matches on stigId/checkContent Copy', async function () {

        const res = await chai.request(config.baseUrl)
          .get(`/collections/${reference.testCollection.collectionId}/reviews/${reference.testAsset.assetId}/${'SV-106179r1_yyyy'}?projection=stigs&projection=rule`)
          .set('Authorization', `Bearer ${user.token}`)
        expect(res).to.have.status(200)
        expect(res.body.stigs).to.not.be.null
        expect(res.body.rule).to.exist
        expect(res.body.ruleId).to.eql("SV-106179r1_yyyy")
        expect(res.body.ruleIds).to.include("SV-106179r1_yyyy");
        expect(res.body.ruleIds).to.include(reference.ruleId)
        const regex = new RegExp(reference.reviewMatchString)
        expect(res.body.detail).to.match(regex)
    })
  })

  describe('Checks for other revs, content matches', () => {

    before(async function () {
      this.timeout(4000)
      await utils.uploadTestStigs()
      await utils.deleteStigByRevision("VPN_SRG_OTHER", "V2R2")
      await utils.loadAppData()
    })

    after(async function () { 
      this.timeout(4000)
      await utils.deleteStig("VPN_SRG_OTHER")
    })

    it('Import a new STIG - clobber', async () => {
                
      const directoryPath = path.join(__dirname, '../../form-data-files/')
      const testStigfile = 'U_VPN_SRG_V1R1_Manual-xccdf.xml'
      const filePath = path.join(directoryPath, testStigfile)

      const res = await chai.request(config.baseUrl)
      .post('/stigs?elevate=true&clobber=true')
      .set('Authorization', `Bearer ${user.token}`)
      .set('Content-Type', `multipart/form-data`)
      .attach('importFile', fs.readFileSync(filePath), testStigfile) // Attach the file here
      let expectedRevData = 
      {
        "benchmarkId": "VPN_SRG_TEST",
        "revisionStr": "V1R1",
        "action": "replaced"
      }
      expect(res).to.have.status(200)
      expect(res.body).to.deep.eql(expectedRevData)
    })
    it('Import another stig with check-system collision', async () => {
                  
      const directoryPath = path.join(__dirname, '../../form-data-files/')
      const testStigfile = "U_VPN_SRG-OTHER_V1R1_Manual-xccdf.xml"    
      const filePath = path.join(directoryPath, testStigfile)

      const res = await chai.request(config.baseUrl)
        .post('/stigs?elevate=true&clobber=true')
        .set('Authorization', `Bearer ${user.token}`)
        .set('Content-Type', `multipart/form-data`)
        .attach('importFile', fs.readFileSync(filePath), testStigfile)
      expect(res).to.have.status(200)
      
      let expectedRevData = 
      {
        "benchmarkId": "VPN_SRG_OTHER",
        "revisionStr": "V2R2",
        "action": "inserted"
    }
      expect(res.body).to.eql(expectedRevData)
    })
    it('Return rule data for the specified revision of a STIG - after import of "other" stig with checkId collision', async () => {

      const res = await chai.request(config.baseUrl)
        .get(`/stigs/${reference.benchmark}/revisions/${reference.testCollection.defaultRevision}/rules?projection=check`)
        .set('Authorization', `Bearer ${user.token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array').of.length(reference.checklistLength)

      let title = "The VPN Gateway must ensure inbound and outbound traffic is configured with a security policy in compliance with information flow control policies."

      for(const rule of res.body){
        if(rule.ruleId === reference.ruleId){
          expect(rule.title).to.eql(title)
          if(rule.check.system === "C-95877r1_chk"){
            expect(rule.check.content).to.not.eql("This check content has been replaced!")
          }
        }
      }
    })
    it("Return rule data for the specified revision of a STIG - expect matches to other rev - requests V2R2", async () => {

      const res = await chai.request(config.baseUrl)
        .get(`/stigs/${'VPN_SRG_OTHER'}/revisions/V2R2/rules?projection=check`)
        .set('Authorization', `Bearer ${user.token}`)
      expect(res).to.have.status(200)
      
      expect(res.body).to.be.an('array').of.length(2)
      let testRuleId = "SV-106179r1_xxxx"
      let title = "This rule title has been replaced."

      for(const rule of res.body){
        if(rule.ruleId === testRuleId){
          expect(rule.title).to.eql(title)
          if(rule.check.system === "C-95877r1_chk"){
            expect(rule.check.content).to.eql("This check content has been replaced!")
          }
        }
      }
    })
    it("Return rule data for the specified Rule in a revision of a STIG. request specific rule, expect one content match", async () => {

      const res = await chai.request(config.baseUrl)
        .get(`/stigs/${reference.benchmark}/revisions/${reference.testCollection.defaultRevision}/rules/${reference.ruleId}?projection=check`)
        .set('Authorization', `Bearer ${user.token}`)
      expect(res).to.have.status(200)
      expect(res.body.ruleId).to.eql(reference.ruleId)
      expect(res.body.check.content).to.not.eql("This check content has been replaced!")
    })
  })

  describe('Replacement Tests', () => {

    before(async function () {
      this.timeout(4000)
      await utils.uploadTestStigs()
      try{
        await utils.deleteStigByRevision("VPN_SRG_TEST", "V1R0")
      }
      catch(e){
        console.log("No V1R0 to delete")
      }
    
      await utils.loadAppData()
    })

    it('Import and replace a STIG revision', async function () {
      
      const directoryPath = path.join(__dirname, '../../form-data-files/')
      const testStigfile = 'U_VPN_SRG_V1R1_Manual-xccdf-replace.xml'
      const filePath = path.join(directoryPath, testStigfile)

      const res = await chai.request(config.baseUrl)
      .post('/stigs?clobber=true&elevate=true')
      .set('Authorization', `Bearer ${user.token}`)
      .set('Content-Type', `multipart/form-data`)
      .attach('importFile', fs.readFileSync(filePath), testStigfile)
      let expectedRevData = 
      {
          "benchmarkId": "VPN_SRG_TEST",
          "revisionStr": "V1R1",
          "action": "replaced"
      }
      expect(res).to.have.status(200)
      expect(res.body).to.deep.eql(expectedRevData)
    })
    it('Return a list of revisions for the specified STIG - check for updated revision', async function () {
      const res = await chai.request(config.baseUrl)
        .get(`/stigs/${reference.benchmark}/revisions`)
        .set('Authorization', `Bearer ${user.token}`)
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array').of.length(1)
      for(const rev of res.body){
        expect(rev.ruleCount).to.eql(2)
      }
    })
    it('Return rule data for the specified revision of a STIG after update', async function () {
      const res = await chai.request(config.baseUrl)
        .get(`/stigs/${reference.benchmark}/revisions/${reference.testCollection.defaultRevision}/rules?projection=detail&projection=ccis&projection=check&projection=fix`)
        .set('Authorization', `Bearer ${user.token}`)
      expect(res).to.have.status(200)
      let title = "This rule title has been replaced."
      expect(res.body).to.be.an('array').of.length(2)
      for(const rule of res.body){
        if (rule.ruleId === reference.ruleId){
              expect(rule.title).to.eql(title)
        }
      }
    })
    it('Return rule data for the specified Rule in a revision of a STIG after update', async function () {

      const res = await chai.request(config.baseUrl)
        .get(`/stigs/${reference.benchmark}/revisions/${reference.testCollection.defaultRevision}/rules/${reference.ruleId}?projection=detail&projection=ccis&projection=check&projection=fix`)
        .set('Authorization', `Bearer ${user.token}`)
        expect(res).to.have.status(200)
        let title = "This rule title has been replaced."
        expect(res.body.title).to.eql(title)
    })
  })
})
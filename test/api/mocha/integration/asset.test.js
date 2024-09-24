const chai = require("chai")
const chaiHttp = require("chai-http")
chai.use(chaiHttp)
const expect = chai.expect
const config = require("../testConfig.json")
const utils = require("../utils/testUtils")
const reference = require("../referenceData.js")

const user = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe(`PUT - attachAssetsToStig - /collections/{collectionId}/stigs/{benchmarkId}/assets`, () => {

  describe('gh-756 - stig-assignments issue', () => {

    before(async function () {
      this.timeout(4000)
      await utils.uploadTestStigs()
      await utils.loadAppData()
      // await utils.createDisabledCollectionsandAssets()
    })
    it('gh-756 issue (assigning a benchmark in one collection removes all assignements for that benchmark from all other collections) . assign a benchmark used in test Collection in scrap Collection', async function () {
      const res = await chai.request(config.baseUrl)
      .put(`/collections/${reference.scrapCollection.collectionId}/stigs/${reference.testCollection.benchmark}/assets?projection=restrictedUserAccess`)
      .set('Authorization', 'Bearer ' + user.token)
      .send([reference.scrapAsset.assetId])
      
      expect(res).to.have.status(200)
      expect(res.body).to.be.an('array')
      expect(res.body).to.be.an('array').of.length(1)
      expect(res.body[0].assetId).to.equal(reference.scrapAsset.assetId)
      expect(res.body[0]).to.have.property('restrictedUserAccess')
    })
    it('Verify that test collection still has expected benchmark assignments', async function () {
        const res = await chai.request(config.baseUrl)
        .get(`/collections/${reference.testCollection.collectionId}/stigs`)
        .set('Authorization', 'Bearer ' + user.token)
        expect(res).to.have.status(200)
        let returnedStigs = []
        for (let stig of res.body) {
            returnedStigs.push(stig.benchmarkId)
        }
        expect(returnedStigs).to.include(reference.testCollection.benchmark);
    })
  })
})

describe(`GET - getChecklistByAssetStig - /assets/{assetId}/checklists/{benchmarkId}/{revisionStr}`, () => { 

  describe('Testing that a valid filename can be produced from an asset that contains os reserved chars', () => {

    before(async function () {
      this.timeout(4000)
      await utils.uploadTestStigs()
      await utils.loadAppData()
    })
    
    let createdAssetId = null
    it('should Create an Asset in collection to be deleted', async function () {
      const res = await chai.request(config.baseUrl)
      .post(`/assets?projection=stigs`)
      .set('Authorization', 'Bearer ' + user.token)
      .send({
        "name": "TxxxxxEST_\\slash:colon..x2",
        "collectionId": reference.scrapCollection.collectionId,
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
            reference.benchmark,
            "Windows_10_STIG_TEST"
        ]
    })
      expect(res).to.have.status(201)
      createdAssetId = res.body.assetId
    })
    it('Return the ckl for Asset with reserved chars', async function () {
      const res = await chai.request(config.baseUrl)
      .get(`/assets/${createdAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}?format=ckl`)
      .set('Authorization', 'Bearer ' + user.token)
      expect(res).to.have.status(200)
      const regex = /^inline; filename="TxxxxxEST_&bsol;slash&colon;colon\.\.x2-VPN_SRG_TEST-V1R1/
      expect(res.headers['content-disposition'], "Content-Disposition is set with expected filename").to.match(regex)

    })
    it('Return the cklB for Asset with reserved chars', async function () {
      const res = await chai.request(config.baseUrl)
      .get(`/assets/${createdAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}?format=cklb`)
      .set('Authorization', 'Bearer ' + user.token)
      expect(res).to.have.status(200)
      const regex = /^inline; filename="TxxxxxEST_&bsol;slash&colon;colon\.\.x2-VPN_SRG_TEST-V1R1/
      expect(res.headers['content-disposition'], "Content-Disposition is set with expected filename").to.match(regex)
    })
    it('Return the xccdf for Asset with reserved chars', async function () {
      const res = await chai.request(config.baseUrl)
      .get(`/assets/${createdAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}?format=xccdf`)
      .set('Authorization', 'Bearer ' + user.token)
      expect(res).to.have.status(200)
      const regex = /^inline; filename="TxxxxxEST_&bsol;slash&colon;colon\.\.x2-VPN_SRG_TEST-V1R1/
      expect(res.headers['content-disposition'], "Content-Disposition is set with expected filename").to.match(regex)
    })
  })
})
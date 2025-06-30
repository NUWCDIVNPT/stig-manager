import {config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { expect } from 'chai'

const user = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

describe('Classification Markings Support', () => {
  let testAssetId

  before(async function () {
    await utils.loadAppData()
  })

  describe('Asset Classification', () => {
    it('Create asset with classification', async function () {
      const assetData = {
        name: "ClassificationTestAsset",
        collectionId: reference.scrapCollection.collectionId,
        description: "Test asset for classification functionality",
        ip: "192.168.1.100",
        noncomputing: false,
        metadata: {},
        classification: "CUI",
        stigs: [reference.benchmark]
      }

      const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', user.token, assetData)
      expect(res.status).to.eql(201)
      expect(res.body.classification).to.equal("CUI")
      testAssetId = res.body.assetId
    })

    it('Get asset with classification', async function () {
      const res = await utils.executeRequest(`${config.baseUrl}/assets/${testAssetId}`, 'GET', user.token)
      expect(res.status).to.eql(200)
      expect(res.body.classification).to.equal("CUI")
    })

    it('Update asset classification', async function () {
      const assetData = {
        name: "ClassificationTestAsset",
        collectionId: reference.scrapCollection.collectionId,
        description: "Test asset for classification functionality",
        ip: "192.168.1.100",
        noncomputing: false,
        metadata: {},
        classification: "FOUO",
        stigs: [reference.benchmark]
      }

      const res = await utils.executeRequest(`${config.baseUrl}/assets/${testAssetId}`, 'PUT', user.token, assetData)
      expect(res.status).to.eql(200)
      expect(res.body.classification).to.equal("FOUO")
    })

    it('Create asset with null classification', async function () {
      const assetData = {
        name: "NullClassificationTestAsset",
        collectionId: reference.scrapCollection.collectionId,
        description: "Test asset with null classification",
        ip: "192.168.1.101",
        noncomputing: false,
        metadata: {},
        classification: null,
        stigs: [reference.benchmark]
      }

      const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', user.token, assetData)
      expect(res.status).to.eql(201)
      expect(res.body.classification).to.be.null
    })
  })

  describe('Review Classification', () => {
    it('Create review with classification markings', async function () {
      const reviewData = {
        result: "open",
        detail: "This is a finding detail with classification",
        detailClassification: "CUI",
        comment: "This is a comment with classification",
        commentClassification: "FOUO"
      }

      const res = await utils.executeRequest(
        `${config.baseUrl}/assets/${testAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}/V-000001`,
        'PUT',
        user.token,
        reviewData
      )
      expect(res.status).to.eql(200)
      expect(res.body.detailClassification).to.equal("CUI")
      expect(res.body.commentClassification).to.equal("FOUO")
    })

    it('Get review with classification markings', async function () {
      const res = await utils.executeRequest(
        `${config.baseUrl}/assets/${testAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}/V-000001`,
        'GET',
        user.token
      )
      expect(res.status).to.eql(200)
      expect(res.body.detailClassification).to.equal("CUI")
      expect(res.body.commentClassification).to.equal("FOUO")
    })

    it('Update review classification markings', async function () {
      const reviewData = {
        result: "open",
        detail: "Updated finding detail",
        detailClassification: "U",
        comment: "Updated comment",
        commentClassification: "CUI"
      }

      const res = await utils.executeRequest(
        `${config.baseUrl}/assets/${testAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}/V-000001`,
        'PUT',
        user.token,
        reviewData
      )
      expect(res.status).to.eql(200)
      expect(res.body.detailClassification).to.equal("U")
      expect(res.body.commentClassification).to.equal("CUI")
    })

    it('Create review with null classification markings', async function () {
      const reviewData = {
        result: "notapplicable",
        detail: "This rule is not applicable",
        detailClassification: null,
        comment: "No comment needed",
        commentClassification: null
      }

      const res = await utils.executeRequest(
        `${config.baseUrl}/assets/${testAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}/V-000002`,
        'PUT',
        user.token,
        reviewData
      )
      expect(res.status).to.eql(200)
      expect(res.body.detailClassification).to.be.null
      expect(res.body.commentClassification).to.be.null
    })
  })

  describe('Export with Classification', () => {
    it('Export CKL should include asset classification', async function () {
      const res = await utils.executeRequest(
        `${config.baseUrl}/assets/${testAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}?format=ckl`,
        'GET',
        user.token
      )
      expect(res.status).to.eql(200)
      expect(res.headers['content-type']).to.include('application/xml')
      
      // Check for classification in filename
      const contentDisposition = res.headers['content-disposition']
      expect(contentDisposition).to.be.a('string')
    })

    it('Export CKLB should include classification markings', async function () {
      const res = await utils.executeRequest(
        `${config.baseUrl}/assets/${testAssetId}/checklists/${reference.benchmark}/${reference.testCollection.defaultRevision}?format=cklb`,
        'GET',
        user.token
      )
      expect(res.status).to.eql(200)
      expect(res.headers['content-type']).to.include('application/json')
      
      const cklbData = JSON.parse(res.body)
      expect(cklbData.target_data.classification).to.equal("FOUO")
    })
  })

  describe('Classification Validation', () => {
    it('Reject invalid classification values', async function () {
      const assetData = {
        name: "InvalidClassificationAsset",
        collectionId: reference.scrapCollection.collectionId,
        description: "Test asset with invalid classification",
        ip: "192.168.1.102",
        noncomputing: false,
        metadata: {},
        classification: "INVALID",
        stigs: [reference.benchmark]
      }

      const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', user.token, assetData)
      expect(res.status).to.eql(400)
    })

    it('Accept valid classification values', async function () {
      const validClassifications = ['NONE', 'U', 'FOUO', 'CUI', 'C', 'S', 'TS', 'SCI']
      
      for (const classification of validClassifications) {
        const assetData = {
          name: `ValidClassification${classification}Asset`,
          collectionId: reference.scrapCollection.collectionId,
          description: `Test asset with ${classification} classification`,
          ip: `192.168.1.${103 + validClassifications.indexOf(classification)}`,
          noncomputing: false,
          metadata: {},
          classification: classification,
          stigs: [reference.benchmark]
        }

        const res = await utils.executeRequest(`${config.baseUrl}/assets`, 'POST', user.token, assetData)
        expect(res.status).to.eql(201)
        expect(res.body.classification).to.equal(classification)
      }
    })
  })

  after(async function () {
    // Clean up test assets
    if (testAssetId) {
      try {
        await utils.executeRequest(`${config.baseUrl}/assets/${testAssetId}`, 'DELETE', user.token)
      } catch (error) {
        console.warn('Failed to clean up test asset:', error.message)
      }
    }
  })
})
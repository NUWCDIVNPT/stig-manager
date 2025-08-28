
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import { expect } from 'chai'

describe('GET - Op', () => {
  let disabledCollection
  before(async function () {
    await utils.loadAppData()
  })

  for(const iteration of iterations){
    describe(`iteration:${iteration.name}`, () => {
      describe('getAppData - /op/appdata', () => {
        it('Export application data', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/appdata?format=jsonl&elevate=true`, 'GET', iteration.token)
          if(iteration.name !== "stigmanadmin"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
        })
      })
      describe('getConfiguration - /op/configuration', () => {
        it('Return API version and configuration information', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/configuration`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
        })
        it('delate alter test', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/configuration`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
        })
      })
      describe('getAppInfo - /op/appinfo', () => {
        it('Return API Deployment Details', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/appinfo?elevate=true`, 'GET', iteration.token)
          if(iteration.name !== "stigmanadmin"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          const rtc = reference.testCollection
          expect(res.body).to.nested.include({
            schema: 'stig-manager-appinfo-v1.1',
            [`collections.${rtc.collectionId}.state`]: rtc.appinfo.state,
            [`collections.${rtc.collectionId}.assets`]: rtc.appinfo.assets,
            [`collections.${rtc.collectionId}.assetsDisabled`]: rtc.appinfo.assetsDisabled,
            [`collections.${rtc.collectionId}.reviews`]: rtc.appinfo.reviews,
            [`collections.${rtc.collectionId}.reviewsDisabled`]: rtc.appinfo.reviewsDisabled,
           
          })
        })

        it('Return API Deployment Details with includeRowCounts=true', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/appinfo?elevate=true&includeRowCounts=true`, 'GET', iteration.token)
          if(iteration.name !== "stigmanadmin"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          expect(res.body.mysql).to.be.an('object')
          expect(res.body.mysql.tables).to.be.an('object')
          
          // When includeRowCounts=true, rowCount should be actual numbers
          for (const tableName in res.body.mysql.tables) {
            const table = res.body.mysql.tables[tableName]
            expect(table).to.have.property('rowCount')
            expect(table.rowCount).to.be.a('number')
          }
        })

        it('Return API Deployment Details with includeRowCounts=false', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/appinfo?elevate=true&includeRowCounts=false`, 'GET', iteration.token)
          if(iteration.name !== "stigmanadmin"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          expect(res.body.mysql).to.be.an('object')
          expect(res.body.mysql.tables).to.be.an('object')
          
          // When includeRowCounts=false, rowCount should be null
          for (const tableName in res.body.mysql.tables) {
            const table = res.body.mysql.tables[tableName]
            expect(table).to.have.property('rowCount')
            expect(table.rowCount).to.be.null
          }
        })

        it('Return API Deployment Details without includeRowCounts param (should default to false)', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/appinfo?elevate=true`, 'GET', iteration.token)
          if(iteration.name !== "stigmanadmin"){
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body).to.be.an('object')
          expect(res.body.mysql).to.be.an('object')
          expect(res.body.mysql.tables).to.be.an('object')
          
          // When includeRowCounts is not specified, it defaults to false, so rowCount should be null
          for (const tableName in res.body.mysql.tables) {
            const table = res.body.mysql.tables[tableName]
            expect(table).to.have.property('rowCount')
            expect(table.rowCount).to.be.null
          }
        })
      })
      describe('getDefinition - /op/definition', () => {
        it('Return API Deployment Definition', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/definition`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
        })
      })
      describe('getDefinition - /op/definition - with jsonPath param', () => {
        it('Return API Deployment Definition', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/op/definition?jsonpath=%24.components.schemas.RoleId`, 'GET', iteration.token)
          expect(res.status).to.eql(200)
          const expectedSchema =  [
            {
              maximum: 4,
              minimum: 1,
              type: "integer"
            }
          ]
          expect(res.body[0]).to.deep.equal(expectedSchema[0])
        })
      })
    })
  }
})

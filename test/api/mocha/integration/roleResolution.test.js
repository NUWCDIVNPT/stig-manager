
import { v4 as uuidv4 } from 'uuid'
import {config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { expect } from 'chai'

const admin = {
  name: "admin",
  grant: "Owner",
  token:
    "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44",
}

const lvl1 = {
    name: "lvl1",
    userId: "85",
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU"
}

const lvl1TestAcl = {
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"154","access":"rw"}],
    response: [
        {
          access: "r",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                label: {
                  name: "test-label-full",
                  labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                },
                access: "r",
                benchmarkId: "VPN_SRG_TEST",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                roleId: 1,
              },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: "Collection_X_lvl1_asset-1",
            assetId: "42",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                label: {
                  name: "test-label-full",
                  labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                },
                access: "r",
                benchmarkId: "VPN_SRG_TEST",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                roleId: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: "VPN_SRG_TEST",
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                roleId: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: "Windows_10_STIG_TEST",
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                roleId: 1,
              },
            },
          ],
        },
      ]
}

describe("Test grantee resolution is resolved from assigning a user to a group", function () {

  before(async function () {
    await utils.loadAppData()
  })

  let tempUser = {}
  let tempGroup = {}
  // create test user 
  it("create a temporary user", async function () {

    let uuid = uuidv4()
    //first 20 chars
    uuid = uuid.substring(0, 20)

    const res = await utils.executeRequest(`${config.baseUrl}/users?elevate=true&projection=collectionGrants&projection=statistics`, 'POST', admin.token, {
      "username": "TEMP_USER" +  uuid,
      "collectionGrants": [
      ]
    })
  
    expect(res.status).to.eql(201) 
    tempUser.userId = res.body.userId
  })

  // create test group
  it("create a temporary userGroup with the user we created in it", async function () {

    let uuid = uuidv4()
    //first 20 chars
    uuid = uuid.substring(0, 20)

    const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true`, 'POST', admin.token, {
      "name": "TEMP_GROUP" +  uuid,
      "description": "TEMP_GROUP" +  uuid,
      userIds: [tempUser.userId]
    })
   
    expect(res.status).to.eql(201) 
    tempGroup.userGroupId = res.body.userGroupId
  })

  // assign it to the test collection 
  it("assign the userGroup to the test collection with restricted grant", async function () {

    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', admin.token, [{
      userGroupId: tempGroup.userGroupId,
      roleId: 1
    }])
    expect(res.status).to.eql(201)
    tempGroup.grantId = res.body[0].grantId
  })

  // then get the grant and test grantee = userGroup.
  it("should return the grant for the user in the collection and check that grantee is from a group grant",async function () {
    

    const res = await utils.executeRequest(`${config.baseUrl}/users/${tempUser.userId}?elevate=true&projection=collectionGrants&projection=userGroups`, 'GET', config.adminToken)
    expect(res.status).to.eql(200)

    for(const grant of res.body.collectionGrants){
        expect(grant.roleId).to.equal(1)
        for(const grantee of grant.grantees){ 
            expect(grantee.userGroupId).to.be.eql(tempGroup.userGroupId)
        }
    }
  })
})

describe(`Testing grantee resolution between a direct grant and group grant`, () => {
  describe(`GET- getEffectiveAclByCollectionUser`, () => {
      before(async function () {
          await utils.loadAppData()
      })

      let userGroup = null
      let userGroupGrantId = null
      let lvl1DirectGrantId = null

      it("Remove Base appdata userGroup from test Colleciton", async () => {

        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`, 'DELETE', admin.token)
    
        expect(res.status).to.eql(200)
      })

      it("should give lvl1 user restricted access to test collection", async () => {
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', admin.token, [{
          "userId": lvl1.userId,
          "roleId": 1
        }])
        expect(res.status).to.eql(201)
        lvl1DirectGrantId = res.body[0].grantId
      })
      // user has direct grant to collection
      it("make sure grantee has a userID property which means it has a direct grant ", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl1.userId}/effective-acl`, 'GET', admin.token)
      
          expect(res.status).to.eql(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userId).to.exist
              }
          }
      })

      // make group
      it("should create a userGroup with lvl1 in it", async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true&projection=users`, 'POST', admin.token, {
              "name": "group" +  uuidv4(),
              "description": "test group",
              "userIds": [
              lvl1.userId   
              ]
          })
          
          userGroup = res.body
          expect(res.status).to.eql(201)
          for(let user of res.body.users) {
              expect(user.userId, "expect userId to be equal to the userId returned from API").to.equal(lvl1.userId)
          }
      })

      // add group to collection
      it("should give created group restricted access to test collection", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', admin.token, [{
              "userGroupId": userGroup.userGroupId,
              roleId: 1
          }])
          expect(res.status).to.eql(201)
          lvl1DirectGrantId = res.body[0].grantId
      })

      it("should set userGroups ACL in test collection", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${lvl1DirectGrantId}/acl`, 'PUT', admin.token, lvl1TestAcl.put)
          expect(res.status).to.eql(200)
      })

      it("should confirm users effective acl was set. User has group and direct grant expect to get effective from the direct", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl1.userId}/effective-acl`, 'GET', admin.token)
      
          expect(res.status).to.eql(200)
          for(const grant of res.body){
              for(const acl of grant.aclSources){
                  expect(acl.grantee.userId).to.exist
              }
          }
      })

      it("should delete users direct grant to test collection", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${lvl1DirectGrantId}`, 'DELETE', admin.token)
          expect(res.status).to.eql(200)
      })

      it("should confirm that the direct grant was deleted", async () => {  
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${lvl1DirectGrantId}`, 'GET', admin.token)
        expect(res.status).to.eql(404)
      })
      
      it("User now only has a group grant, check that grantee was resolved from a group", async () => {

        const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl1.userId}/effective-acl`, 'GET', admin.token)
        expect(res.status).to.eql(200)
        for(const grant of res.body){
            for(const acl of grant.aclSources){
                expect(acl.grantee.userGroupId).to.exist
            }
        }
      })

      it("should delete the userGroup", async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${userGroup.userGroupId}?elevate=true`, 'DELETE', admin.token)
          expect(res.status).to.eql(200)
      })

      it("should confirm that the userGroup was deleted", async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${userGroup.userGroupId}?elevate=true`, 'GET', admin.token)
          expect(res.status).to.eql(404)
      })
      
      it("User now has no grant to the collection should get 422 error", async () => {

          const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/users/${lvl1.userId}/effective-acl`, 'GET', admin.token)
          expect(res.status).to.eql(200)
          expect(res.body).to.be.empty
      })
  })
})

describe(`Multiple Group roleId Collisions`, () => {

  before(async function () {
      await utils.loadAppData()
  })
  
  let userGroup1
  let userGroup2
  let userGroup3

  it("Remove Base appdata userGroup from test Colleciton", async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${reference.testCollection.testGroup.testCollectionGrantId}`, 'DELETE', admin.token)

    expect(res.status).to.eql(200)
  })

  it("Delete base appdata userGroup", async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${reference.testCollection.testGroup.userGroupId}?elevate=true`, 'DELETE', admin.token)
    expect(res.status).to.eql(200)
  })

  it('should create a test user group with lvl1 user in it.', async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true&projection=collections`, 'POST', config.adminToken, {
      "name": "CollisionGroup1",
      "description": "test group",
      "userIds": [
        lvl1.userId   
      ]
    })
    userGroup1 = res.body
    expect(res.status).to.eql(201)
    expect(res.body.collections).to.be.empty
  })

  it('should create another test user group with lvl1 user in it.', async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true&projection=collections`, 'POST', config.adminToken, {
      "name": "CollisionGroup2",
      "description": "test group",
      "userIds": [
        lvl1.userId   
      ]
    })
    userGroup2 = res.body
    expect(res.status).to.eql(201)
    expect(res.body.collections).to.be.empty
  })
  
  it("should assign both groups created to the test collection with restricted grant", async function () {

    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', config.adminToken, [{
      userGroupId: userGroup1.userGroupId,
      roleId: 1
    }])
    expect(res.status).to.eql(201)
    expect(res.body[0].roleId).to.equal(1)
    userGroup1.grantId = res.body[0].grantId

    const res2 = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', config.adminToken, [{
      userGroupId: userGroup2.userGroupId,
      roleId: 1
    }])
    expect(res2.status).to.eql(201)
    expect(res2.body[0].roleId).to.equal(1)
    userGroup2.grantId = res2.body[0].grantId
  })

  it("get lvl1 user check that lvl1 user obtained roleId = 1 due to membership in two groups with roleId = 1", async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/users/${reference.lvl1User.userId}?elevate=true&projection=collectionGrants&projection=userGroups`, 'GET', config.adminToken)
    expect(res.status).to.eql(200)

    for(const grant of res.body.collectionGrants){
      expect(grant.roleId).to.equal(1)
      for(const grantee of grant.grantees){ 
        expect(grantee.name).to.be.oneOf([userGroup1.name, userGroup2.name])
      }
    }
  })

  it("should change userGroup1 roleId to 2", async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}`, 'PUT', config.adminToken, {
      userGroupId: userGroup1.userGroupId,
      roleId: 2
    })
    expect(res.status).to.eql(200)
    expect(res.body.roleId).to.equal(2)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained roleId = 2 due to membership in two groups with highest being roleId = 2", async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/users/${reference.lvl1User.userId}?elevate=true&projection=collectionGrants&projection=userGroups`, 'GET', config.adminToken)
    expect(res.status).to.eql(200) 

    for(const grant of res.body.collectionGrants){
      expect(grant.roleId).to.equal(2)
      for(const grantee of grant.grantees){ 
        expect(grantee.name).to.be.oneOf([userGroup1.name, userGroup2.name])
      }
    }
  })

  it("should change userGroup2 roleId to 3", async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${userGroup2.grantId}`, 'PUT', config.adminToken, {
      userGroupId: userGroup2.userGroupId,
      roleId: 3
    })
    expect(res.status).to.eql(200)
    expect(res.body.roleId).to.equal(3)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained roleId = 3 due to membership in two groups with highest being roleId = 3", async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/users/${reference.lvl1User.userId}?elevate=true&projection=collectionGrants&projection=userGroups`, 'GET', config.adminToken)
    expect(res.status).to.eql(200)

    for(const grant of res.body.collectionGrants){
      expect(grant.roleId).to.equal(3)
      for(const grantee of grant.grantees){ 
        expect(grantee.name).to.be.oneOf([userGroup1.name, userGroup2.name])
      }
    }
  })

  it("should change userGroup1 roleId to 4", async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants/${userGroup1.grantId}`, 'PUT', config.adminToken, {
      userGroupId: userGroup1.userGroupId,
      roleId: 4
    })
    expect(res.status).to.eql(200)
    expect(res.body.roleId).to.equal(4)
  })
  
  it("get users assigned to the test collection and check that lvl1 user obtained roleId = 4 due to membership in two groups with highest being roleId = 4", async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/users/${reference.lvl1User.userId}?elevate=true&projection=collectionGrants&projection=userGroups`, 'GET', config.adminToken)
    expect(res.status).to.eql(200)

    for(const grant of res.body.collectionGrants){
      expect(grant.roleId).to.equal(4)
      for(const grantee of grant.grantees){ 
        expect(grantee.name).to.be.oneOf([userGroup1.name, userGroup2.name])
      }
    }
  })

  it("create a new userGroup with lvl1 user in it", async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true&projection=collections`, 'POST', config.adminToken, {
      "name": "CollisionGroup3",
      "description": "test group",
      "userIds": [
        lvl1.userId   
      ]
    })
    userGroup3 = res.body
    expect(res.status).to.eql(201)
    expect(res.body.collections).to.be.empty
  })

  it("assign userGroup3 to the test collection with roleId = 4", async () => {
    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', config.adminToken, [{
      userGroupId: userGroup3.userGroupId,
      roleId: 4
    }])
    expect(res.status).to.eql(201)
    expect(res.body[0].roleId).to.equal(4)
  })

  it("get users assigned to the test collection and check that lvl1 user obtained roleId = 4 due to membership in three groups with two groups being roleId = 4", async () => {

    const res = await utils.executeRequest(`${config.baseUrl}/users/${reference.lvl1User.userId}?elevate=true&projection=collectionGrants&projection=userGroups`, 'GET', config.adminToken)

    expect(res.status).to.eql(200)
    for(const grant of res.body.collectionGrants){
      expect(grant.roleId).to.equal(4)
      expect(grant.grantees.length).to.equal(2)
      for(const grantee of grant.grantees){ 
        expect(grantee.name).to.be.oneOf([userGroup1.name, userGroup2.name, userGroup3.name])
      }
    }
  })
})

describe("Testing user grant for a user that has a 'grantee' from a userGroup grant", function () {

  before(async function () {
    await utils.loadAppData()
  })

  let tempUserID = null
  let tempGroupID = null
  // create test user 
  it("create a temporary user with no grants", async function () {

    let uuid = uuidv4()
    //first 20 chars
    uuid = uuid.substring(0, 20)

    const res = await utils.executeRequest(`${config.baseUrl}/users?elevate=true&projection=collectionGrants&projection=statistics`, 'POST', admin.token, {
      "username": "TEMP_USER" +  uuid,
      "collectionGrants": [
      ]
    })
  
    expect(res.status).to.eql(201) 
    tempUserID = res.body.userId
  })

  // create test group
  it("create a temporary userGroup with our temp user in it", async function () {

    let uuid = uuidv4()
    //first 20 chars
    uuid = uuid.substring(0, 20)
    const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true`, 'POST', admin.token, {
      "name": "TEMP_GROUP" +  uuid,
      "description": "TEMP_GROUP" +  uuid,
      userIds: [tempUserID]
    })
   
    expect(res.status).to.eql(201) 
    tempGroupID = res.body.userGroupId
  })

  // assign it to the test collection 
  it("assign the userGroup to the test collection with restricted grant", async function () {

    const res = await utils.executeRequest(`${config.baseUrl}/collections/${reference.testCollection.collectionId}/grants`, 'POST', admin.token, [{
      userGroupId: tempGroupID,
      roleId: 1
    }])
    expect(res.status).to.eql(201)
  })

  // then get the grant and test grantee = userGroup.
  it("should return the grant for the user in the collection and check that grantee is from a group grant",async function () {
    
    const res = await utils.executeRequest(`${config.baseUrl}/users/${tempUserID}?elevate=true&projection=collectionGrants&projection=userGroups`, 'GET', config.adminToken)
    expect(res.status).to.eql(200)

    for(const grant of res.body.collectionGrants){
        expect(grant.roleId).to.equal(1)
    }
  })
})

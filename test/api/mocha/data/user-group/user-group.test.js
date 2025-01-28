
import { v4 as uuidv4 } from 'uuid'
import {config } from '../../testConfig.js'
import * as utils from '../../utils/testUtils.js'
import reference from '../../referenceData.js'
import {iterations} from '../../iterations.js'
import {expect} from 'chai'

describe('user-group', () => {

  for(const iteration of iterations) {

    describe(`iteration:${iteration.name}`, () => {

      describe('POST - user-groups', () => {

        describe(`POST - createUserGroup - /user-groups`, () => {
        
          it('should create a userGroup', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true&projection=collections&projection=users&projection=attributions`, 'POST', iteration.token, {
                  "name": "group" +  uuidv4(),
                  "description": "test group",
                  "userIds": [
                    iteration.userId,    
                  ]
              })
              if(iteration.name != "stigmanadmin"){
                expect(res.status).to.eql(403)
                return
              }
              expect(res.status).to.eql(201)
              expect(res.body.name).to.contain('group')
              expect(res.body.description).to.equal('test group')
              expect(res.body.collections).to.be.empty
              for(let user of res.body.users) {
                expect(user.userId, "expect userId to be equal to the userId returned from API").to.equal(iteration.userId)
                expect(user.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
              }
              expect(res.body.attributions.created.userId, "expect userId to be equal to the userId returned from API").to.equal(iteration.userId)
              expect(res.body.attributions.created.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
              expect(res.body.attributions.modified.userId, "expect userId to be equal to the userId returned from API").to.equal(iteration.userId)
              expect(res.body.attributions.modified.username, "expect username to be equal to the username returned from API").to.equal(iteration.name)
          })

          if(iteration.name == "stigmanadmin"){
          
            it('should throw SmError.UnprocessableError Duplicate name exists.', async () => {
              const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true`, 'POST', iteration.token, {
                    "name": reference.testCollection.testGroup.name,
                    "description": "test group",
                    "userIds": [
                      iteration.userId   
                    ]
                  })
                if(iteration.name != "stigmanadmin"){
                  expect(res.status).to.eql(403)
                  return
                }
                expect(res.status).to.eql(422)
            })
          }
        })
      })

      describe('GET - user-groups', () => {
        
        before(async function () {
            await utils.loadAppData()
        })

        describe(`getUserGroups - /user-groups`, () => {

          it('should return all userGroups  ', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/user-groups?projection=users&projection=collections&elevate=true`, 'GET', iteration.token)
            
            if(iteration.name != "stigmanadmin"){
              expect(res.status).to.eql(403)
              return
            }
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(1)
            expect(res.body[0].name).to.equal(reference.testCollection.testGroup.name)
            expect(res.body[0].description).to.equal(reference.testCollection.testGroup.description)
            expect(res.body[0].userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)

            expect(res.body[0].users).to.be.an('array').of.length(1)
            for(const user of res.body[0].users) {
              expect(user.userId, "expect lvl1 user to be in the group").to.equal(reference.lvl1User.userId)
              expect(user.username, "expect username to be equal to the username returned from API").to.equal(reference.lvl1User.username)
            }

            expect(res.body[0].collections).to.be.an('array').of.length(1)

            for(const collection of res.body[0].collections) {
                expect(collection.collectionId, "expect that this group is in the test collection 21").to.equal(reference.testCollection.collectionId)
                expect(collection.name, "expect that this group is in the test collection 21").to.equal(reference.testCollection.name)
            }
            
          })
          it('should return all userGroups no projections for all users sucess ', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/user-groups`, 'GET', iteration.token)
              
            expect(res.status).to.eql(200)
            expect(res.body).to.be.an('array').of.length(1)
            expect(res.body[0].name).to.equal(reference.testCollection.testGroup.name)
            expect(res.body[0].description).to.equal(reference.testCollection.testGroup.description)
            expect(res.body[0].userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
          })
        })
        
        describe(`getUserGroup - /user-groups/{userGroupId}`, () => {

          it('should return the test usergroup', async () => {
            const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${reference.testCollection.testGroup.userGroupId}`, 'GET', iteration.token)
           
            expect(res.status).to.eql(200)
            expect(res.body.name).to.equal(reference.testCollection.testGroup.name)
            expect(res.body.description).to.equal(reference.testCollection.testGroup.description)
            expect(res.body.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
          })
        })
      })
     
      describe('PATCH - user-groups', () => {

        describe(`PATCH - patchUserGroup - /user-groups/{userGroupId}`, async () => {

            it("should change the name and description of the userGroup", async () => {
                const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${reference.testCollection.testGroup.userGroupId}?elevate=true`, 'PATCH', iteration.token, {
                        "name": "patchedName",
                        "description": "patchedDescription"
                    })

                if(iteration.name != "stigmanadmin"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                expect(res.body.name).to.equal('patchedName')
                expect(res.body.description).to.equal('patchedDescription')
                expect(res.body.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
            })

            it("should change userId list of the group ", async () => {
                const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${reference.testCollection.testGroup.userGroupId}?elevate=true&projection=users`, 'PATCH', iteration.token, {
                        "userIds": [
                            reference.lvl1User.userId,
                            reference.stigmanadmin.userId
                        ]
                    })

                if(iteration.name != "stigmanadmin"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(200)
                expect(res.body.name).to.equal('patchedName')
                expect(res.body.description).to.equal('patchedDescription')
                expect(res.body.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
                expect(res.body.users).to.be.an('array').of.length(2)
                for(const user of res.body.users) {
                    expect(user.userId).to.be.oneOf([reference.lvl1User.userId, reference.stigmanadmin.userId])
                }
            })
            
            it("should return empty 404, usergroupId doesnt exist", async () => {
                let randomUserGroupId = "1234321"
                const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${randomUserGroupId}?elevate=true`, 'PATCH', iteration.token, {
                        "name": "test",
                        "description": "patchedDescription"
                    })
                if(iteration.name != "stigmanadmin"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(404)
            })
        })
      })

      describe('PUT - user-groups', () => {

        describe(`PUT - putUserGroup - /user-groups/{userGroupId}`, async () => {

          it(`Set all properties of a user group`, async () => {
            const newGroupName = "putGroupName" +  uuidv4()
            const newDescription = "putDescription" + uuidv4()
            const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${reference.testCollection.testGroup.userGroupId}?elevate=true&projection=users`, 'PUT', iteration.token, {
              "name": newGroupName,
              "description": newDescription,
              "userIds": [
                reference.lvl1User.userId, reference.stigmanadmin.userId 
              ]
            })

            if(iteration.name != "stigmanadmin"){
                expect(res.status).to.eql(403)
                return
            }
            expect(res.status).to.eql(200)
            expect(res.body.name).to.equal(newGroupName)
            expect(res.body.description).to.equal(newDescription)
            expect(res.body.userGroupId).to.equal(reference.testCollection.testGroup.userGroupId)
            expect(res.body.users).to.be.an('array').of.length(2)
            for(const user of res.body.users) {
              expect(user.userId).to.be.oneOf([reference.lvl1User.userId, reference.stigmanadmin.userId])
            }
          })
        })
      })

      describe('DELETE - user-groups', () => {


        describe(`DELETE - deleteUserGroup - /user-groups/{userGroupId}`, async () => {

            let testGroup

            it('should create a userGroup if user can elevate ', async () => {
                const res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true`, 'POST', iteration.token, {
                    "name": "group" +  uuidv4(),
                    "description": "test group",
                    "userIds": [
                        iteration.userId,    
                    ]
                })
                if(iteration.name != "stigmanadmin"){
                    expect(res.status).to.eql(403)
                    return
                }
                expect(res.status).to.eql(201)
                testGroup = res.body
            })
            
            if(iteration.name == "stigmanadmin"){
                it("should delete the test userGroup", async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${testGroup.userGroupId}?elevate=true`, 'DELETE', iteration.token)
                    if(iteration.name != "stigmanadmin"){
                        expect(res.status).to.eql(403)
                        return
                    }
                    expect(res.status).to.eql(200)
                    expect(res.body.userGroupId).to.equal(testGroup.userGroupId)
                    expect(res.body.name).to.equal(testGroup.name)
                    expect(res.body.description).to.equal(testGroup.description)
                })

                it("verify that the userGroup is deleted", async () => {
                    const res = await utils.executeRequest(`${config.baseUrl}/user-groups/${testGroup.userGroupId}`, 'GET', iteration.token)
                    expect(res.body.error).to.exist
                })
            }
        })
      })
    })
  }
})
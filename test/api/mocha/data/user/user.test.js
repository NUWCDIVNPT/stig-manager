const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const config = require('../../testConfig.json')
const utils = require('../../utils/testUtils.js')
const iterations = require('../../iterations.js')
const reference = require('../../referenceData.js')
const requestBodies = require('./requestBodies.js')

let testUser = null
const randomValue = Math.floor(Math.random() * 10000)

describe('user', () => {

  before(async function () {
    await utils.loadAppData()
  })

  for(const iteration of iterations) {

    describe(`iteration:${iteration.name}`, () => {

      before(async function () {
        await utils.loadAppData()
          // this is here because after we do the gets we need to create a temp user to do all posts, patches, and puts etc on. 
      // as a result we will have an extra user in the gets to consider
        const create =  JSON.parse(JSON.stringify(requestBodies.scrapUser))
        create.username = create.username + Math.floor(Math.random() * 1000) + Date.now()
        testUser = await utils.createUser(create)
      })

      describe('GET - user', () => {

        describe(`getUserObject - /user`, () => {

          it('Return the requesters user information - check user', async () => {
            const res = await chai
                .request(config.baseUrl)
                .get(`/user`)
                .set('Authorization', 'Bearer ' + iteration.token)

            expect(res).to.have.status(200)
            expect(res.body.username, "expect username to be current user").to.equal(iteration.name)
            for(grant of res.body.collectionGrants) {
              expect(grant).to.exist
              expect(grant).to.have.property('collection')
            }
          })
        })
        
        describe(`getUsers - /user`, () => {

          it('Return a list of users accessible to the requester USERNAME', async () => {

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?elevate=true&username=${reference.wfTest.username}&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)

            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body[0].username, "expect user to be wf-test").to.equal('wf-test')
            expect(res.body[0].userId, "expect userId to be wfTest userId").to.equal(reference.wfTest.userId)
          })
          it('Return a list of users accessible to the requester username with match=exact', async () => {

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?elevate=true&username=${reference.wfTest.username}&username-match=exact&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)

            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body[0].username, "expect user to be wf-test").to.equal('wf-test')
            expect(res.body[0].userId, "expect userId to be wfTest userId").to.equal(reference.wfTest.userId)
          })
          it('Return a list of users accessible to the requester username with match=startsWith', async () => {

            // get first 3 characters of username
            const username = reference.wfTest.username.substring(0, 3)

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?elevate=true&username=${username}&username-match=startsWith&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)

            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body[0].username, "expect user to be wf-test").to.equal('wf-test')
            expect(res.body[0].userId, "expect userId to be wfTest userId").to.equal(reference.wfTest.userId)
          })
          it('Return a list of users accessible to the requester username with match=endsWith', async () => {

            // get last 3 characters of username
            const username = reference.wfTest.username.substring(reference.wfTest.username.length - 3)

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?elevate=true&username=${username}&username-match=endsWith&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)

            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body[0].username, "expect user to be wf-test").to.equal('wf-test')
            expect(res.body[0].userId, "expect userId to be wfTest userId").to.equal(reference.wfTest.userId)
          })
          it('Return a list of users accessible to the requester username with match=contains', async () => {

            // get middle 3 characters of username
            const username = reference.wfTest.username.substring(3, 6)

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?elevate=true&username=${username}&username-match=contains&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)

            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body[0].username, "expect user to be wf-test").to.equal('wf-test')
            expect(res.body[0].userId, "expect userId to be wfTest userId").to.equal(reference.wfTest.userId)
          })
          it('Return a list of user accessible to the requester USERNAME no projections', async () => {

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?elevate=true&username=${reference.wfTest.username}`)
                .set('Authorization', 'Bearer ' + iteration.token)
            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body[0].username,"expect user to be wf-test").to.equal('wf-test')
            expect(res.body[0].userId, "expect userId to be wfTest userId").to.equal(reference.wfTest.userId)
          })
          it('Return a list of user accessible to the requester with elevate and projections', async () => {

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?elevate=true&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)
            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            // plus one for test user created in before
            expect(res.body, "expect to get back all usersIds with elevate").to.be.an('array').of.length(reference.allUserIds.length + 1)
            for(let user of res.body) {
              expect(user).to.have.property('collectionGrants')
              expect(user).to.have.property('statistics')
              expect(user).to.have.property('username')
              expect(user).to.have.property('userId')
              const newIds = reference.allUserIds.concat(testUser.userId)
              expect(user.userId, "expect userId to be one of the users the system").to.be.oneOf(newIds)
            }
          })
          it('Return a list of users accessible to the requester no projections for lvl1 success. ', async () => {

            const res = await chai
                .request(config.baseUrl)
                .get(`/users`)
                .set('Authorization', 'Bearer ' + iteration.token)
      
            expect(res).to.have.status(200)
            // plus one for test user created in before
            expect(res.body).to.be.an('array').of.length(reference.allUserIds.length + 1)
            for(let user of res.body) {
              // plus one for test user created in before
              const newIds = reference.allUserIds.concat(testUser.userId)
              expect(user.userId, "expect userId to be one of the users the system").to.be.oneOf(newIds)
            }
          })
          it("should throw SmError.PrivilegeError no elevate with projections.", async () => {

            const res = await chai
                .request(config.baseUrl)
                .get(`/users?projection=collectionGrants`)
                .set('Authorization', 'Bearer ' + iteration.token)
            expect(res).to.have.status(403)
          })
        })

        describe(`getUserByUserId - /users{userId}`, async () => {

          it('Return a user', async () => {
            const res = await chai
                .request(config.baseUrl)
                .get(`/users/${reference.wfTest.userId}?elevate=true&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)
            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('collectionGrants')
            expect(res.body).to.have.property('statistics')
            expect(res.body.username, "expect username to be wf-Test").to.equal(reference.wfTest.username)
            expect(res.body.userId, "expect userId to be wf-Test userId (22)").to.equal(reference.wfTest.userId)
          })
        })
      })

      describe('POST - user', () => {
        describe(`POST - createUser - /users`, () => {
          
          let tempUser = null
          it('Create a user', async () => {
            const res = await chai
                .request(config.baseUrl)
                .post(`/users?elevate=true&projection=collectionGrants&projection=statistics`)
                .set('Authorization', 'Bearer ' + iteration.token)
                .send({
                  "username": "TEMP_USER" +  randomValue,
                  "collectionGrants": [
                      {
                          "collectionId": `${reference.scrapCollection.collectionId}`,
                          "accessLevel": 1
                      }
                  ]
              })
              if(iteration.name != "stigmanadmin"){
                expect(res).to.have.status(403)
                return
              }
              tempUser = res.body
              expect(res).to.have.status(201)
              expect(res.body).to.be.an('object')
              for(let grant of res.body.collectionGrants) {
                expect(grant).to.have.property('collection')
                expect(grant).to.have.property('accessLevel')
                expect(grant.collection.collectionId, "Expect collectionId to be scrapColleciton Id").to.equal(reference.scrapCollection.collectionId)
              }
              const createdUser = await utils.getUser(res.body.userId)
              expect(createdUser).to.be.an('object')
              expect(createdUser.username, "expecte created userId to be equal to the userId retured from API").to.equal(res.body.username)
              expect(createdUser.userId, ).to.equal(res.body.userId)
              expect(createdUser.collectionGrants).to.be.an('array')
              expect(createdUser.collectionGrants, "expect created user to have a single grant to scrap collection").to.have.lengthOf(1)
          })
          if(iteration.name == "stigmanadmin"){
          
            it('should throw SmError.UnprocessableError collectionIds are invalid.', async () => {
              const res = await chai
                  .request(config.baseUrl)
                  .post(`/users?elevate=true`)
                  .set('Authorization', 'Bearer ' + iteration.token)
                  .send({
                    "username": "TEST_USER" + randomValue,
                    "collectionGrants": [
                        {
                            "collectionId": `${randomValue}`,
                            "accessLevel": 1
                        }
                    ]
                })
                if(iteration.name != "stigmanadmin"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(422)
            })
            it('should throw SmError.UnprocessableError Duplicate name exists.', async () => {
              const res = await chai
                  .request(config.baseUrl)
                  .post(`/users?elevate=true`)
                  .set('Authorization', 'Bearer ' + iteration.token)
                  .send({
                    "username": `${tempUser.username}`,
                    "collectionGrants": [
                        {
                            "collectionId": `${reference.scrapCollection.collectionId}`,
                            "accessLevel": 1
                        }
                    ]
                })
                if(iteration.name != "stigmanadmin"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(422)
            })
          }
          if(iteration.name == "stigmanadmin"){
            it('cleanup - delete temp user', async () => {
              const res = await chai
                  .request(config.baseUrl)
                  .delete(`/users/${tempUser.userId}?elevate=true`)
                  .set('Authorization', 'Bearer ' + iteration.token)
              if(iteration.name != "stigmanadmin"){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(200)
            })
          }
        
        })
      })

      describe('PATCH - user', () => {

        describe(`PATCH - updateUser - /users{userId}`, async () => {

          it('Merge provided properties with a user - Change Username', async () => {
            const res = await chai
                  .request(config.baseUrl)
                  .patch(`/users/${testUser.userId}?elevate=true&projection=collectionGrants&projection=statistics`)
                  .set('Authorization', 'Bearer ' + iteration.token)
                  .send({
                    "username": "PatchTest",
                })
                if(iteration.name != "stigmanadmin"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(200)
                expect(res.body.username).to.equal('PatchTest')
                expect(res.body.userId, "expect userId to be equal to scraplvl1users userId").to.equal(testUser.userId)

                for(let grant of res.body.collectionGrants) {
                  expect(grant).to.have.property('collection')
                  expect(grant).to.have.property('accessLevel')
                  expect(grant.collection.collectionId, "expect collectionId to be scrapCollection Id").to.equal(reference.scrapCollection.collectionId)
                }

                const userEffected = await utils.getUser(testUser.userId)

                expect(userEffected).to.be.an('object')
                expect(userEffected.username, "expectthe effected user to be the one returned by the api").to.equal(res.body.username)
                expect(userEffected.userId,"expectthe effected user to be the one returned by the api").to.equal(res.body.userId)
          })
          it("should throw SmError.UnprocessableError collectionIds are invalid.", async () => {
            const res = await chai
                .request(config.baseUrl)
                .patch(`/users/${testUser.userId}?elevate=true`)
                .set('Authorization', 'Bearer ' + iteration.token)
                .send({
                  "username": "PatchTest",
                  "collectionGrants": [
                      {
                          "collectionId": `${Math.floor(Math.random() * 100022)}`,
                          "accessLevel": 1
                      }
                  ]
                })
                if(iteration.name != "stigmanadmin"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(422)
          })
        })
      })

      describe('PUT - user', () => {
        describe(`PUT - replaceUser - /users{userId}`, async () => {

          it(`Set all properties of a user - Change Username`, async () => {
          const res = await chai
            .request(config.baseUrl)
            .put(`/users/${testUser.userId}?elevate=true&projection=collectionGrants&projection=statistics`)
            .set('Authorization', 'Bearer ' + iteration.token)
            .send({
              "username": "putTesting",
              "collectionGrants": [
                  {
                      "collectionId": `${reference.scrapCollection.collectionId}`,
                      "accessLevel": 1
                  }
              ]
            })
            if(iteration.name != "stigmanadmin"){
              expect(res).to.have.status(403)
              return
            }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body.username, "expect username to be putTesting").to.equal('putTesting')
            expect(res.body.userId, "expect userId to be scraplvl1").to.equal(testUser.userId)
            expect(res.body.collectionGrants).to.be.an('array')
            expect(res.body.statistics).to.be.an('object')

            for(let grant of res.body.collectionGrants) {
              expect(grant).to.have.property('collection')
              expect(grant).to.have.property('accessLevel')
              expect(grant.collection.collectionId, "expect to have grant to the scrap collection").to.equal(reference.scrapCollection.collectionId)
            }

            const userEffected = await utils.getUser(res.body.userId)

            expect(userEffected).to.be.an('object')
            expect(userEffected.username, "user effected to have username returned by API").to.equal(res.body.username)
            expect(userEffected.userId, "user effected to have Id returned by API").to.equal(res.body.userId)
            expect(userEffected.collectionGrants).to.be.an('array')

          })

          it("should throw SmError.UnprocessableError collectionIds are invalid.", async () => {
            const res = await chai
                .request(config.baseUrl)
                .put(`/users/${testUser.userId}?elevate=true`)
                .set('Authorization', 'Bearer ' + iteration.token)
                .send({
                  "username": "putTesting",
                  "collectionGrants": [
                      {
                          "collectionId": `${Math.floor(Math.random() * 100022)}`,
                          "accessLevel": 1
                      }
                  ]
                })
                if(iteration.name != "stigmanadmin"){
                  expect(res).to.have.status(403)
                  return
                }
                expect(res).to.have.status(422)
          })
        })
      })

      describe('DELETE - user', () => {

        describe(`DELETE - deleteUser - /users/{userId}`, async () => {
          it('Delete a user - fail due to user access record', async () => {
            const res = await chai
              .request(config.baseUrl)
              .delete(`/users/${reference.testCollection.collectionOwnerID}?elevate=true&projection=collectionGrants&projection=statistics`)
              .set('Authorization', 'Bearer ' + iteration.token)
              if(iteration.name != "stigmanadmin"){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(422)
          })
          it('Delete a user - succeed, as user has never accessed the system', async () => {
            const res = await chai
              .request(config.baseUrl)
              .delete(`/users/${reference.deleteUser.userId}?elevate=true`)
              .set('Authorization', 'Bearer ' + iteration.token)
              if(iteration.name != "stigmanadmin"){
                expect(res).to.have.status(403)
                return
              }
              expect(res).to.have.status(200)
              const userEffected = await utils.getUser("43")
              expect(userEffected.status, "expect 404 response (user delete worked)").to.equal(404)
          })
          it('Delete a user - not elevated expect fail', async () => {
            const res = await chai
              .request(config.baseUrl)
              .delete(`/users/${43}?elevate=false`)
              .set('Authorization', 'Bearer ' + iteration.token)

              expect(res).to.have.status(403)
          })
          if(iteration.name === "stigmanadmin"){
            it('Delete test user for cleanup', async () => {
              const res = await chai
                .request(config.baseUrl)
                .delete(`/users/${testUser.userId}?elevate=true`)
                .set('Authorization', 'Bearer ' + iteration.token)
                expect(res).to.have.status(200)
            })
          }
        })
      
      })
    })
  }
})
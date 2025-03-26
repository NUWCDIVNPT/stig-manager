import {config } from '../testConfig.js'
import {expect, use} from 'chai'
import * as utils from '../utils/testUtils.js'
import chaiDateTime from 'chai-datetime'
use(chaiDateTime)

const users = [
  {
    userId: '1',
    username: "admin",
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjIwNTc3ODc4MjgsImlhdCI6MTc0MjQyNzgyOCwiYXV0aF90aW1lIjoxNzQyNDI3MjIxLCJqdGkiOiJmYjA2NGI1NS1jODk2LTRlNTctYTY5Ny04ZWY0ZjE1M2NiNmQiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL3N0aWdtYW4iLCJzdWIiOiJiZjg3YTE2Zi0zOWU2LTQ2ZDktODk3MS1mMGVmNTFkZDNmODUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJzaWQiOiIzOGE3NDA5Yy00YTYzLTQzMTEtYWI2Mi01ZGU3OGY1NzNkNWMiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiY3JlYXRlX2NvbGxlY3Rpb24iLCJhZG1pbiJdfSwic2NvcGUiOiJzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOm9wIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlcjpzdGlnIiwibmFtZSI6IkFkbWluIEJ1cmtlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW4iLCJnaXZlbl9uYW1lIjoiQWRtaW4iLCJmYW1pbHlfbmFtZSI6IkJ1cmtlIn0.gT0EHb8wxKrv9McDdka1r_a2h5ZAUIYuEqgifrCOPcq7qlN1VEfstQPUZFMQ3iLisF33pxLnWDoQxSyw5HP5ftsQC3zN-O_NM9Q1MMNZGFEttNMaYRnBdoOWg9yrzu_4ys1fHRuj_T8orObhw1w3nOczkjoVLY0kA1TrC40huGU',
    status: 'available',
    statusDate: new Date('2025-01-01T00:00:00Z'),
    statusUser: null
  },
  {
    userId: '2',
    username: "user01",
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjIwNTc3ODgxMjMsImlhdCI6MTc0MjQyODEyMywiYXV0aF90aW1lIjoxNzQyNDI4MTIzLCJqdGkiOiIzMmVmZmY2OC1jZWE2LTRlN2MtOTM2ZC0zNTYwMDY0ZDQ1NmMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL3N0aWdtYW4iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNzZkYThhODgtZmI0OC00NDc3LWE5MjAtZDg4YTZiODc0N2ZhIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoic3RpZy1tYW5hZ2VyIiwic2lkIjoiNzU2ZDI4YmUtNDU2OC00ZDM5LTk2YzUtZDdlOGQ4ZDA3ODdmIiwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoic3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIiwibmFtZSI6Ik1hcmxleSBBdGtpbnNvbiIsInByZWZlcnJlZF91c2VybmFtZSI6InVzZXIwMSIsImdpdmVuX25hbWUiOiJNYXJsZXkiLCJmYW1pbHlfbmFtZSI6IkF0a2luc29uIn0.cJVTAfXst--mYmwIgWE07e_hqUlzTEoPN4AkcyI4w_6N_cOLgApSBZBiyIX_VZT4vZ41co73lGyXYQvM_ji9myQWVsjFoXmGG4Dcf72Ci42B5NxQSpuU3A_3zzNdj7QUvtwm5tIGpGkuBBJclZ_2719n7VFmpJ1ye4r-YKin248',
    status: 'unavailable',
    statusDate: new Date('2025-01-01T00:00:01Z'),
    statusUser: '1'
  }
]
const statusErrorMessage = 'User status is "unavailable".'
const inconsistentErrorMessage = 'Setting collectionGrants or userGroups is inconsistent with status "unavailable".'

describe('User Status GET Tests', function () {
  before(async function () {
    await utils.loadAppData('user-status-get-post.jsonl')
  })
  for (const user of users) {
    describe(`GET - getUsers - /users - as ${user.username}`, function () {
      let res
      before(async function () {
        res = await utils.executeRequest(`${config.baseUrl}/users`, 'GET', user.token)
      })
      if (user.status === 'unavailable') {
        it(`returned a 403 status`, function () {
          expect(res.status).to.equal(403)
        })
        it('returned the status error message', function () {
          expect(res.body.error).to.eql(statusErrorMessage)
        })
      }
      else {    
        it('returned a list of two users', async function () {
          expect(res.status).to.equal(200)
          expect(res.body).to.be.an('array')
          expect(res.body.length).to.eql(2)
        })
        for (const [index, user] of users.entries()) {
          it(`returned item ${index} with userId = ${user.userId}`, function () {
            expect(res.body[index].userId).to.eql(user.userId)
          })
          it(`returned item ${index} with username = ${user.username}`, function () {
            expect(res.body[index].username).to.eql(user.username)
          })
          it(`returned item ${index} with status = ${user.status}`, function () {
            expect(res.body[index].status).to.eql(user.status)
          })
          it(`returned item ${index} with statusDate = ${user.statusDate.toISOString()}`, function () {
            expect(new Date(res.body[index].statusDate)).to.equalTime(user.statusDate)
          })
          it(`returned item ${index} with statusUser = ${user.statusUser}`, function () {
            expect(res.body[index].statusUser).to.eql(user.statusUser)
          })
        }
      }
    })
  }

  describe('GET - getUsers - /users - available only', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users?status=available`, 'GET', users[0].token)
    })
    it('returned a list of one user', async function () {
      expect(res.status).to.equal(200)
      expect(res.body).to.be.an('array')
      expect(res.body.length).to.eql(1)
    })
    it(`returned item 0 with username = admin`, function () {
      expect(res.body[0].username).to.eql('admin')
    })
  })
  
  describe('GET - getUsers - /users - unavailable only', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users?status=unavailable`, 'GET', users[0].token)
    })
    it('returned a list of one user', async function () {
      expect(res.status).to.equal(200)
      expect(res.body).to.be.an('array')
      expect(res.body.length).to.eql(1)
    })
    it(`returned item 0 with username = user01`, function () {
      expect(res.body[0].username).to.eql('user01')
    })

  })

  describe('GET - getUser - /user - as admin', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/user`, 'GET', users[0].token)
    })
    it('returned a single user', async function () {
      expect(res.status).to.equal(200)
      expect(res.body).to.be.an('object')
    })
 
    it('returned user = admin', async function () {
      expect(res.status).to.equal(200)
      expect(res.body).to.be.an('object')
      expect(res.body.username).to.eql(users[0].username)
    })
    it('returned user with status = available', async function () {
      expect(res.body.status).to.eql(users[0].status)
    })
    it('returned user with statusDate = 2025-01-01T00:00:00Z', async function () {
      expect(new Date(res.body.statusDate)).to.equalTime(users[0].statusDate)
    })
    it('returned user with statusUser = null', async function () {
      expect(res.body.statusUser).to.eql(users[0].statusUser)
    })
  })

  for (const user of users) {
    describe('GET - getUserByUserId - /users/' + user.userId + ' - as admin', function () {
      let res
      before(async function () {
        res = await utils.executeRequest(`${config.baseUrl}/users/${user.userId}?elevate=true&projection=statistics`, 'GET', users[0].token)
      })
      
      it(`returned user = ${user.username}`, function () {
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('object')
        expect(res.body.username).to.eql(user.username)
      })
      it(`returned user with status = ${user.status}`, function () {
        expect(res.body.status).to.eql(user.status)
      })
      it(`returned user with statusDate = ${user.statusDate.toISOString()}`, function () {
        expect(new Date(res.body.statusDate)).to.equalTime(user.statusDate)
      })
      it(`returned user with statusUser = ${user.statusUser}`, function () {
        expect(res.body.statusUser).to.eql(user.statusUser)
      })
    })
  }
})

describe('User Status POST Tests', function () {
  before(async function () {
    await utils.loadAppData('user-status-get-post.jsonl')
  })
  describe(`POST - createUser - /users`, function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users?elevate=true`, 'POST', users[0].token, {
        username: 'user02',
        collectionGrants: [],
        userGroups:[]
      })
    })
    it('returned a 201 status', function () {
      expect(res.status).to.equal(201)
    })
    it('returned the username', function () {
      expect(res.body.username).to.eql('user02')
    })
    it('returned status = available', function () {
      expect(res.body.status).to.eql('available')
    })
    it('returned statusDate = now', function () {
      expect(new Date(res.body.statusDate)).to.be.closeToTime(new Date(), 1000)
    })
    it('returned statusUser = null', async function () {
      expect(res.body.statusUser).to.eql(users[0].statusUser)
    })
  })
  describe('POST - createCollection - /collections with unavailable user grant', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/collections`, 'POST', users[0].token, {
        name: 'collection02',
        description: 'Collection 02',
        grants: [
          {
            "userId": "1",
            "roleId": 4
          },
          {
            "userId": "2",
            "roleId": 4
          }
        ]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe('POST - createUserGroup - /user-groups with unavailable user', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/user-groups?elevate=true`, 'POST', users[0].token, {
        name: 'group01',
        userIds: ["2"]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
})

describe('User Status PATCH Tests', function () {
  before(async function () {
    await utils.loadAppData('user-status-patch-put.jsonl')
  })
  describe(`PATCH - updateUser - /users/3 - available => unavailable`, function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users/3?elevate=true&projection=collectionGrants&projection=userGroups`, 'PATCH', users[0].token, {
        status: 'unavailable'
      })
    })
    it('returned a 200 status', function () {
      expect(res.status).to.equal(200)
    })
    it('returned the userId', function () {
      expect(res.body.userId).to.be.a('string')
    })
    it('returned the username', function () {
      expect(res.body.username).to.eql('user02')
    })
    it('returned status = unavailable', function () {
      expect(res.body.status).to.eql('unavailable')
    })
    it('returned statusDate = now', function () {
      expect(new Date(res.body.statusDate)).to.be.closeToTime(new Date(), 1)
    })
    it('returned statusUser = 1', function () {
      expect(res.body.statusUser).to.eql('1')
    })
    it ('returned empty collection grants', function () {
      expect(res.body.collectionGrants).to.eql([])
    })
    it ('returned empty user groups', function () {
      expect(res.body.userGroups).to.eql([])
    })
  })
  describe(`PATCH - updateUser - /users/4 - available => unavailable with grants`, function () {
    let res
    before(async function () {
      await utils.loadAppData('user-status-patch-put.jsonl')
      res = await utils.executeRequest(`${config.baseUrl}/users/4?elevate=true`, 'PATCH', users[0].token, {
        status: 'unavailable',
        collectionGrants: [{collectionId: '1', roleId: 3}]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe(`PATCH - updateUser - /users/4 - available => unavailable with groups`, function () {
    let res
    before(async function () {
      await utils.loadAppData('user-status-patch-put.jsonl')
      res = await utils.executeRequest(`${config.baseUrl}/users/4?elevate=true`, 'PATCH', users[0].token, {
        status: 'unavailable',
        userGroups: ['1']
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe(`PATCH - updateUser - /users/2 - unavailable user given grants`, function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users/2?elevate=true`, 'PATCH', users[0].token, {
        collectionGrants: [{collectionId: '1', roleId: 3}]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe(`PATCH - updateUser - /users/2 - unavailable user given groups`, function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users/2?elevate=true`, 'PATCH', users[0].token, {
        userGroups: ['1'],
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe(`PATCH - updateCollection - /collections/1 - with unavailable user grant`, function () {
    let res
    before(async function () {
      await utils.loadAppData('user-status-patch-put.jsonl')
      res = await utils.executeRequest(`${config.baseUrl}/collections/1`, 'PATCH', users[0].token, {
        grants: [
          {
            "userId": "1",
            "roleId": 4
          },
          {
            "userId": "2",
            "roleId": 4
          }
        ]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe('PATCH - patchUserGroup - /user-groups/1 with unavailable user', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/user-groups/1?elevate=true`, 'PATCH', users[0].token, {
        userIds: ["2"]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
})

describe('User Status PUT Tests', function () {
  before(async function () {
    await utils.loadAppData('user-status-patch-put.jsonl')
  })
  describe(`PUT - updateUser - /users/3 - available => unavailable`, function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users/3?elevate=true&projection=collectionGrants&projection=userGroups`, 'PUT', users[0].token, {
        status: 'unavailable',
        username: 'user02',
        collectionGrants: [],
        userGroups:[]
      })
    })
    it('returned a 200 status', function () {
      expect(res.status).to.equal(200)
    })
    it('returned the userId', function () {
      expect(res.body.userId).to.be.a('string')
    })
    it('returned the username', function () {
      expect(res.body.username).to.eql('user02')
    })
    it('returned status = unavailable', function () {
      expect(res.body.status).to.eql('unavailable')
    })
    it('returned statusDate = now', function () {
      expect(new Date(res.body.statusDate)).to.be.closeToTime(new Date(), 1)
    })
    it('returned statusUser = 1', function () {
      expect(res.body.statusUser).to.eql('1')
    })
    it ('returned empty collection grants', function () {
      expect(res.body.collectionGrants).to.eql([])
    })
    it ('returned empty user groups', function () {
      expect(res.body.userGroups).to.eql([])
    })
  })
  describe(`PUT - updateUser - /users/4 - available => unavailable with grants`, function () {
    let res
    before(async function () {
      await utils.loadAppData('user-status-patch-put.jsonl')
      res = await utils.executeRequest(`${config.baseUrl}/users/4?elevate=true&projection=collectionGrants&projection=userGroups`, 'PUT', users[0].token, {
        username: 'user03',
        status: 'unavailable',
        collectionGrants: [{collectionId: '1', roleId: 3}],
        userGroups: []
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
    it('returned the error message', function () {
      expect(res.body.error).to.eql(inconsistentErrorMessage)
    })
  })
  describe(`PUT - updateUser - /users/4 - available => unavailable with groups`, function () {
    let res
    before(async function () {
      await utils.loadAppData('user-status-patch-put.jsonl')
      res = await utils.executeRequest(`${config.baseUrl}/users/4?elevate=true&projection=collectionGrants&projection=userGroups`, 'PUT', users[0].token, {
        username: 'user03',
        status: 'unavailable',
        collectionGrants: [],
        userGroups: ['1']
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
    it('returned the error message', function () {
      expect(res.body.error).to.eql(inconsistentErrorMessage)
    })
  })
  describe(`PUT - updateUser - /users/2 - unavailable given grants`, function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users/2?elevate=true`, 'PUT', users[0].token, {
        username: 'user01',
        collectionGrants: [{collectionId: '1', roleId: 3}]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe(`PUT - updateUser - /users/2 - unavailable given groups`, function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/users/2?elevate=true`, 'PATCH', users[0].token, {
        username: 'user01',
        userGroups: ['1'],
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe(`PUT - replaceCollection - /collections/1 - with unavailable user grant`, function () {
    let res
    before(async function () {
      // await utils.loadAppData('user-status-patch-put.jsonl')
      res = await utils.executeRequest(`${config.baseUrl}/collections/1`, 'PATCH', users[0].token, {
        name: 'status-collection',
        grants: [
          {
            "userId": "1",
            "roleId": 4
          },
          {
            "userId": "3",
            "roleId": 4
          },
          {
            "userId": "2",
            "roleId": 4
          }
        ]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe('PUT - putUserGroup - /user-groups/1 with unavailable user', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/user-groups/1?elevate=true`, 'PATCH', users[0].token, {
        name: 'status-group',
        userIds: ["2"]
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })
  describe('PUT - putGrantByCollectionGrant - /collections/1/grants/2 with unavailable user', function () {
    let res
    before(async function () {
      res = await utils.executeRequest(`${config.baseUrl}/collections/1/grants/2`, 'PUT', users[0].token, {
        userId: '2',
        roleId: 3
      })
    })
    it('returned a 422 status', function () {
      expect(res.status).to.equal(422)
    })
  })  
})

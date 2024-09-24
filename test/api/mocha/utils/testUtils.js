const axios = require('axios')
const config = require('../testConfig.json')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

const adminToken = config.adminToken

// canidate for a function? (used to store responses for a test (metrics))
const metricsOutputToJSON = (testCaseName, username, responseData, outputJsonFile) => {
  const metricsFilePath = path.join(__dirname, outputJsonFile)
  let metricsData = JSON.parse(fs.readFileSync(metricsFilePath, 'utf8'))
  if (!metricsData[testCaseName]) {
    metricsData[testCaseName] = {}
  }
  metricsData[testCaseName][username] = responseData
  fs.writeFileSync(metricsFilePath, JSON.stringify(metricsData, null, 2), 'utf8')
}

const loadAppData = async (appdataFileName = 'appdata.json') => {

  //const appdataFile = path.join(__dirname, '../../form-data-files/appdata.json')
  const appdataFile = path.join(__dirname, `../../form-data-files/${appdataFileName}`)
  const formData = new FormData()
  formData.append('importFile', fs.createReadStream(appdataFile), {
    filename: 'appdata.json',
    contentType: 'application/json'
  })
  const axiosConfig = {
    method: 'post',
    url: `${config.baseUrl}/op/appdata?elevate=true`,
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${adminToken}`
    },
    data: formData
  }
  try {
    const response = await axios(axiosConfig)
  } catch (error) {
    throw error
  }
}

const createTempCollection = async (collectionPost) => {
  try {
    // if no collecitonPost is passed in, use the default
    if (!collectionPost) {
      collectionPost = 
        {
          name: 'temoCollection' + Math.floor(Math.random() * 1000) + Date.now(),
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
            pocName: 'poc2Put',
            pocEmail: 'pocEmailPut@email.com',
            pocPhone: '12342',
            reqRar: 'true'
          },
          grants: [
            {
              userId: '1',
              accessLevel: 4
            },
            {
              userId: '85',
              accessLevel: 1
            }
          ],
          labels: [
            {
              name: 'TEST',
              description: 'Collection label description',
              color: 'ffffff'
            }
          ]
        }
    }
    const res = await axios.post(
      `${config.baseUrl}/collections?elevate=true&projection=grants&projection=labels`,
      collectionPost,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res
  }
  catch (e) {
    throw e;
  }
}

const deleteCollection = async (collectionId) => {
  try {
    await axios.delete(
      `${config.baseUrl}/collections/${collectionId}?elevate=true&projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
  } catch (e) {
    throw e;
  }
}

const createTempAsset = async asset => {
  if (!asset) {
    asset = {
      name: 'tempAsset' + Date.now(),
      collectionId: "21",
      description: 'temp',
      ip: '1.1.1.1',
      noncomputing: true,
      labelIds: [],
      metadata: {
        pocName: 'pocName',
        pocEmail: 'pocEmail@example.com',
        pocPhone: '12345',
        reqRar: 'true'
      },
      stigs: ['VPN_SRG_TEST', 'Windows_10_STIG_TEST']
    }
  }
  try {
    const res = await axios.post(`${config.baseUrl}/assets`, asset, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    return res
  } catch (e) {
    throw e;
  }
}

const deleteAsset = async assetId => {
  try {
    await axios.delete(
      `${config.baseUrl}/assets/${assetId}?projection=statusStats&projection=stigs&projection=stigGrants`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (e) {
    throw e;
  }
}

const createDisabledCollectionsandAssets = async () => {
  // this also should create stig grants for a user, add reviews too .
  const collection = await createTempCollection()
  const asset = await createTempAsset()
  await setStigGrants(21, 85, asset.data.assetId)
  await importReview(21, asset.data.assetId)
  await deleteAsset(asset.data.assetId)
  await deleteCollection(collection.data.collectionId)
  return {collection: collection.data , asset: asset.data}
}

const importReview = async (collectionId, assetId, ruleId = "SV-106179r1_rule") => {
  try {
    const res = await axios.post(
      `${config.baseUrl}/collections/${collectionId}/reviews/${assetId}`,
      [
        {
        "ruleId": ruleId,
        "result": "pass",
        "detail": "test\nvisible to lvl1",
        "comment": "sure",
        "autoResult": false,
        "status": "submitted"
        }
    ],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res
  } catch (e) {
    throw e;
  }
}

const setStigGrants = async (collectionId, userId, assetId) => {
  try {
    const res = await axios.put(
      `${config.baseUrl}/collections/${collectionId}/grants/${userId}/access`,
      [
        {
            "benchmarkId": "VPN_SRG_TEST",
            "assetId": `${assetId}`
        },
        {
            "benchmarkId": "VPN_SRG_TEST",
            "assetId": "42"
        },
        {
            "benchmarkId": "VPN_SRG_TEST",
            "assetId": "154"
        }        
    ],
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
    )
    return res
  } catch (e) {
    throw e;
  }
}

const uploadTestStig = async (filename) => {

  const directoryPath = path.join(__dirname, '../../form-data-files/')
  const filePath = path.join(directoryPath, filename)
  const formData = new FormData()
  formData.append('importFile', fs.createReadStream(filePath), {
    filename,
    contentType: 'text/xml'
  })

  const axiosConfig = {
    method: 'post', 
    url: `${config.baseUrl}/stigs?elevate=true&clobber=true`,
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${adminToken}`
    },
    data: formData
  }

  try {
    const response = await axios(axiosConfig)
  } catch (error) {
    throw error
  }
}

const uploadTestStigs = async () => {
  const testFilenames = [
    'U_MS_Windows_10_STIG_V1R23_Manual-xccdf.xml',
    'U_RHEL_7_STIG_V3R0-3_Manual-xccdf.xml',
    'U_VPN_SRG_V1R1_Manual-xccdf-replace.xml',
    'U_VPN_SRG_V1R1_Manual-xccdf.xml',
   // 'U_VPN_SRG_V2R3_Manual-xccdf-reviewKeyChange.xml',
    'U_VPN_SRG-OTHER_V1R1_Manual-xccdf.xml',
   // 'U_VPN_SRG_V1R0_Manual-xccdf.xml',
    'U_VPN_SRG-OTHER_V1R1_twoRules-matchingFingerprints.xml'
  ]
  const directoryPath = path.join(__dirname, '../../form-data-files/')

  for (const filename of testFilenames) {
    const formData = new FormData()
    const filePath = path.join(directoryPath, filename)
    formData.append('importFile', fs.createReadStream(filePath), {
      filename,
      contentType: 'text/xml'
    })

    const axiosConfig = {
      method: 'post',
      url: `${config.baseUrl}/stigs?elevate=true&clobber=true`,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${adminToken}`
      },
      data: formData
    }

    try {
      const response = await axios(axiosConfig)
    } catch (error) {
      throw error
    }
  }
}

const deleteStigByRevision = async (benchmarkId, revisionStr) => {
  try {
    const res = await axios.delete(
      `${config.baseUrl}/stigs/${benchmarkId}/revisions/${revisionStr}?elevate=true&force=true`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res
  } catch (e) {
    throw e
  }
}

const deleteStig = async (benchmarkId) => {
  try {

    const axiosConfig = {
      method: 'delete',
      url: `${config.baseUrl}/stigs/${benchmarkId}?elevate=true&force=true`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        }
      }
    const res = await axios(axiosConfig)
    return res
  } catch (e) {
    throw e
  }
}

const getAsset = async assetId => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/assets/${assetId}?projection=statusStats&projection=stigs&projection=stigGrants`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
    if (e.response && e.response.status === 403) {
      return { status: 403 } // return an object with the 404 status
    }
    throw e 
  }
}

const getStigByBenchmarkId = async benchmarkId => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/stigs/${benchmarkId}?elevate=true`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json' 
        }
      }
    )
    return res.data
  }
  catch (e) {
    if (e.response && e.response.status === 404) {
      return { status: 404 } // return an object with the 404 status
    }
    throw e 
  }
}

const getUser = async userId => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/users/${userId}?elevate=true&projection=collectionGrants&projection=statistics`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
    if (e.response && e.response.status === 404) {
      return { status: 404 } // return an object with the 404 status
    }
    throw e 
  }
}

const getAssetsByLabel = async (collectionId, labelId) => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/collections/${collectionId}/labels/${labelId}/assets`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
   throw e
  }
}

const getCollectionMetricsDetails = async (collectionId) => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/collections/${collectionId}/metrics/detail`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
   throw e
  }
}

const getReviews = async (collectionId) => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/collections/${collectionId}/reviews/`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
   throw e
  }
}

const getChecklist = async (assetId, benchmarkId, revisionStr) => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/assets/${assetId}/checklists/${benchmarkId}/${revisionStr}?format=ckl`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
  throw e
  }
}

const getCollection = async (collectionId) => {
  try {
    const res = await axios.get(
      `${config.baseUrl}/collections/${collectionId}?projection=grants&projection=assets&projection=labels&projection=owners&projection=statistics&projection=stigs`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
    if (e.response && e.response.status === 403) {
      return { status: 403 } 
    }
    throw e
  }
}

const setDefaultRevision = async (collectionId, benchmarkId, revisionStr) => {

  try {
    const res = await axios.post(
      `${config.baseUrl}/collections/${collectionId}/stigs/${benchmarkId}`,
      {"defaultRevisionStr": revisionStr},
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res
  }
  catch (e) {
   return e
  }

}

const putReviewByAssetRule = async (collectionId, assetId, ruleId, body) => {

  try {
    const res = await axios.put(
      `${config.baseUrl}/collections/${collectionId}/reviews/${assetId}/${ruleId}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res
  }
  catch (e) {
    throw e
  }
}

const deleteReviewsByAssetRule = async (collectionId, assetId, ruleId) => {

  try{
    const res = await axios.delete(
      `${config.baseUrl}/collections/${collectionId}/reviews/${assetId}/${ruleId}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }
  catch (e) {
    throw e
  }
}

const resetTestAsset = async () => {
  const res = await putAsset("42", {
    name: "Collection_X_lvl1_asset-1",
    collectionId: "21",
    description: "",
    fqdn: null,
    ip: "",
    noncomputing: true,
    mac: null,
    labelIds: [
      "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "5130dc84-9a68-11ec-b1bc-0242ac110002",
    ],
    metadata: {
      testkey: "testvalue",
    },
    stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
  })
  const res2 = await setRestrictedUsers("21", "86", [
    {
      assetId: "42",
      benchmarkId: "Windows_10_STIG_TEST",
    },
  ])
  const res3 = await setRestrictedUsers("21", "85", [
    {
      assetId: "42",
      benchmarkId: "VPN_SRG_TEST",
    },
  ])
}

const resetScrapAsset = async () => {
  const res = await putAsset("34", {
    name: "test asset stigmanadmin",
    collectionId: "1",
    description: "test desc",
    ip: "1.1.1.1",
    fqdn: null,
    noncomputing: true,
    mac: null,
    labelIds: [],
    metadata: {},
    stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST","RHEL_7_STIG_TEST"],
    })
}

const setRestrictedUsers = async (collectionId, userId, body) => {

  try{
    const res = await axios.put(
      `${config.baseUrl}/collections/${collectionId}/grants/${userId}/access`,
      body,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res
  }
  catch (e) {
    throw e
  }
}

const createUser = async (user) => {
  try {
    const res = await axios.post(
      `${config.baseUrl}/users?elevate=true`,
      user,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
    throw e
  }
}

const putAsset = async (assetId, asset) => {
  try {
    const res = await axios.put(
      `${config.baseUrl}/assets/${assetId}`,
      asset,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
    throw e
  }
}

const putCollection = async (collectionId, collection) => {
  try {
    const res = await axios.put(
      `${config.baseUrl}/collections/${collectionId}`,
      collection,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
    throw e
  }
}

const createCollectionLabel = async (collectionId, label) => {
  try {
    const res = await axios.post(
      `${config.baseUrl}/collections/${collectionId}/labels`,
      label,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  }
  catch (e) {
    throw e
  }
}

module.exports = {
  createCollectionLabel,
  putCollection,
  putReviewByAssetRule,
  createUser,
  deleteReviewsByAssetRule,
  resetTestAsset,
  resetScrapAsset,
  setRestrictedUsers,
  loadAppData,
  deleteCollection,
  uploadTestStigs,
  deleteAsset,
  putAsset,
  setDefaultRevision,
  createTempAsset,
  createDisabledCollectionsandAssets,
  createTempCollection,
  getAsset,
  getAssetsByLabel,
  getUser,
  getReviews,
  getCollectionMetricsDetails,
  getChecklist,
  importReview,
  deleteStig,
  getStigByBenchmarkId,
  getCollection,
  uploadTestStig,
  deleteStigByRevision
}

import { config } from '../testConfig.js'
import { Blob } from 'buffer'
import { readFileSync, writeFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import reference from '../referenceData.js';

const baseUrl = config.baseUrl
const adminToken = config.adminToken
const saveMetricsData = process.env.STIGMAN_SAVE_METRICS_DATA === 'true'
// New flag to control whether to create new files or update existing ones
const createNewMetricsFiles = process.env.STIGMAN_NEW_METRICS_FILES === 'true'

const executeRequest = async (url, method, token, body = null) => {

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null,
  }
  const response = await fetch(url, options)
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  })
  return {
    status: response.status,
    headers,
    body: await response.json().catch(() => ({}))
  }
}

/**
 * Generic function to output metrics data to a JSON file
 * @param {string} testCaseName - The test case name
 * @param {string} username - The username
 * @param {Object} responseData - The response data to save
 * @param {string} outputMetricsResponsesFile - Path to the output file
 */
const outputMetricsToJSON = (testCaseName, username, responseData, outputMetricsResponsesFile) => {
  // Determine the actual file path based on the createNewMetricsFiles flag
  let actualOutputFile = outputMetricsResponsesFile
  if (createNewMetricsFiles) {
    // Extract directory and filename
    const lastSlashIndex = outputMetricsResponsesFile.lastIndexOf('/')
    const lastBackslashIndex = outputMetricsResponsesFile.lastIndexOf('\\')
    const separatorIndex = Math.max(lastSlashIndex, lastBackslashIndex)
    
    if (separatorIndex >= 0) {
      const dir = outputMetricsResponsesFile.substring(0, separatorIndex + 1)
      const file = outputMetricsResponsesFile.substring(separatorIndex + 1)
      actualOutputFile = `${dir}new-${file}`
    } else {
      // No directory in the path, just prepend 'new-'
      actualOutputFile = `new-${outputMetricsResponsesFile}`
    }
  }
 
  // Read existing file to preserve all data
  let metricsData = {}
  try {
    const fileContent = readFileSync(actualOutputFile, 'utf8')
    metricsData = JSON.parse(fileContent)
  } catch (err) {
    console.log(`Error creating new metrics file or parsing existing file: ${err.message}`)
    // Continue with empty object if file doesn't exist or parsing fails
  }
  
  // Update metrics data with new test case data
  if (!metricsData[testCaseName]) {
    metricsData[testCaseName] = {}
  }
  metricsData[testCaseName][username] = responseData
  
  // Write back to file as JSON
  writeFileSync(actualOutputFile, JSON.stringify(metricsData, null, 2), 'utf8')
}

/**
 * Conditionally outputs metrics data based on the STIGMAN_SAVE_METRICS_DATA environment variable
 * Works for both regular metrics and meta metrics
 * @param {string} testCaseName - The test case name
 * @param {string} username - The username
 * @param {Object} responseData - The response data to save
 * @param {string} outputJsonFile - Path to the output file
 */
const conditionalMetricsOutput = (testCaseName, username, responseData, outputJsonFile) => {
  // Only record metrics if the environment variable is set
  if (saveMetricsData) {
    outputMetricsToJSON(testCaseName, username, responseData, outputJsonFile)
  }
}



const getUUIDSubString = (length = 20) => {
  return uuidv4().substring(0, length)
}

/**
 * Export application data as JSONL
 * @param {object} options - Options for exporting
 * @param {string} options.format - Format of the exported data (default: 'jsonl')
 * @returns {Promise<string>} - The exported data
 */
const exportAppData = async (options = {}) => {
  const format = options.format || 'jsonl'
  
  const response = await fetch(`${baseUrl}/op/appdata?elevate=true&format=${format}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to export data: ${response.status} ${response.statusText}`)
  }
  
  return response.text()
}

const loadAppData = async (appdataFileName = 'appdata.jsonl') => {


  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const filePath = join(__dirname, `../../appdata/${appdataFileName}`);
  
  const fileContent = readFileSync(filePath, 'utf-8')
  
  const res = await fetch(`${baseUrl}/op/appdata?elevate=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/jsonl', 
    },
    body: fileContent,
  })
  
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`HTTP error, Status: ${res.status}, Message: ${errorText}`)
  }
  const data = await res.text()
  return data

}

/**
 * Loads all appdata files from the appdata directory, then exports them as JSONL
 * @param {string} appdataDir - Directory containing appdata files (default: 'appdata')
 * @returns {Promise<Array>} - Results of processing each file
 */
const loadAndExportAllAppData = async (appdataDir = 'appdata') => {
  const { readdir } = await import('fs/promises')

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const dirPath = join(__dirname, `../../${appdataDir}`)
  
  // Read all files in the directory
  const files = await readdir(dirPath)
  const results = []
  
  // Process each file
  for (const file of files) {
    try {
      console.log(`Loading ${file}...`)
      // Load the appdata file
      await loadAppData(file)
      
      console.log(`Exporting data as JSONL...`)
      // Export data in JSONL format using our utility function
      const exportedData = await exportAppData({ format: 'jsonl' })
      
      // Create output filename
      const outputPath = join(dirPath, file)
      
      // Save to new existing file
      writeFileSync(outputPath, exportedData, 'utf8')
      
      console.log(`Saved to ${outputPath}`)
      results.push({ file, success: true, outputPath })
    } 
    catch (error) {
      console.error(`Error processing ${file}:`, error)
      results.push({ file, success: false, error: error.message })
    }
  }
  
  return results
}

const createTempCollection = async (collectionPost) => {
  // if no collecitonPost is passed in, use the default
  if (!collectionPost) {
    collectionPost = 
      {
        name: 'temoCollection' + getUUIDSubString(),
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
            roleId: 4
          },
          {
            userId: '85',
            roleId: 1
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
  
  const res = await fetch(`${baseUrl}/collections?elevate=true&projection=grants&projection=labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(collectionPost)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteCollection = async (collectionId) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}?elevate=true&projection=assets&projection=grants&projection=owners&projection=statistics&projection=stigs`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const createTempAsset = async asset => {
  if (!asset) {
    asset = {
      name: 'tempAsset' + getUUIDSubString(),
      collectionId: "21",
      description: 'temp',
      ip: '1.1.1.1',
      noncomputing: true,
      labelNames: [],
      metadata: {
        pocName: 'pocName',
        pocEmail: 'pocEmail@example.com',
        pocPhone: '12345',
        reqRar: 'true'
      },
      stigs: ['VPN_SRG_TEST', 'Windows_10_STIG_TEST']
    }
  }

  const res = await fetch(`${baseUrl}/assets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(asset)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteAsset = async assetId => {

  const res = await fetch(`${baseUrl}/assets/${assetId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const importReview = async (collectionId, assetId, ruleId = "SV-106179r1_rule") => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/reviews/${assetId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      {
        "ruleId": ruleId,
        "result": "pass",
        "detail": "test\nvisible to lvl1",
        "comment": "sure",
        "autoResult": false,
        "status": "submitted"
      }
    ])
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const uploadTestStig = async (filename) => {

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const filePath = join(__dirname, `../../form-data-files/${filename}`)
  
  const fileContent = readFileSync(filePath, 'utf-8')
  
  // Create a Blob for the file content
  const blob = new Blob([fileContent], { type: 'text/xml' })

  const formData = new FormData()
  formData.append('importFile', blob, filename)


  const response = await fetch(`${baseUrl}/stigs?elevate=true&clobber=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`)
  }

  const data = await response.json()
  return data
}

const deleteStigByRevision = async (benchmarkId, revisionStr) => {

  const res = await fetch(`${baseUrl}/stigs/${benchmarkId}/revisions/${revisionStr}?elevate=true&force=true`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteStig = async (benchmarkId) => {

  const res = await fetch(`${baseUrl}/stigs/${benchmarkId}?elevate=true&force=true`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getAsset = async assetId => {
  const res = await fetch(`${baseUrl}/assets/${assetId}?projection=statusStats&projection=stigs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) { 
    if (res.status === 403) {
      return { status: 403 }
    }
    throw new Error(`HTTP error, Status: ${res.status}`)
  }

  return await res.json()
}

const getStigByBenchmarkId = async benchmarkId => {
  try {

    const res = await fetch(`${baseUrl}/stigs/${benchmarkId}?elevate=true`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
    })
    if (!res.ok) { 
      if(res.status === 404) {
        return { status: 404 }
      }
      throw new Error(`HTTP error, Status: ${res.status}`)
    }
    return res.json()
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

    const res = await fetch(`${baseUrl}/users/${userId}?elevate=true&projection=collectionGrants&projection=statistics`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
    })
    if (!res.ok) { 
      if(res.status === 404) {
        return { status: 404 }
      }
      throw new Error(`HTTP error, Status: ${res.status}`)
    }
    return res.json()
  }
  catch (e) {
    if (e.response && e.response.status === 404) {
      return { status: 404 } // return an object with the 404 status
    }
    throw e 
  }
}

const getAssetsByLabel = async (collectionId, labelId) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/labels/${labelId}/assets`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getCollectionMetricsDetails = async (collectionId) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/metrics/detail`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getReviews = async (collectionId) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/reviews`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const getChecklist = async (assetId, benchmarkId, revisionStr) => {

  const res = await fetch(`${baseUrl}/assets/${assetId}/checklists/${benchmarkId}/${revisionStr}?format=ckl`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.text()
}

const getCollection = async (collectionId) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}?projection=grants&projection=assets&projection=labels&projection=owners&projection=statistics&projection=stigs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    if (res.status === 403) {
      return { status: 403 }
    }
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const setDefaultRevision = async (collectionId, benchmarkId, revisionStr) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/stigs/${benchmarkId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"defaultRevisionStr": revisionStr})
  })
  if (!res.ok) {
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const putReviewByAssetRule = async (collectionId, assetId, ruleId, body) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/reviews/${assetId}/${ruleId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
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
    labelNames: [
      reference.testCollection.fullLabelName,
      reference.testCollection.lvl1LabelName,
    ],
    metadata: {
      testkey: "testvalue",
    },
    stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
  })
  const res2 = await setRestrictedUsers("21", "1", [
    {
      assetId: "42",
      benchmarkId: "Windows_10_STIG_TEST",
      access: "rw"
    },
  ])
  const res3 = await setGroupAccess("21", "32", 
    [
      {
        benchmarkId: 'VPN_SRG_TEST',
        labelId: '5130dc84-9a68-11ec-b1bc-0242ac110002',
        access: 'rw'
      },
      {
        assetId: '62',
        access: 'r'
      },
      {
        benchmarkId: 'VPN_SRG_TEST',
        assetId: '154',
        access: 'r'
      }
    ])


  
}

const setGroupAccess = async (collectionId, grantId, body) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/grants/${grantId}/acl`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const resetScrapAsset = async () => {
  try{ 
    const res = await putAsset("34", {
      name: "test asset stigmanadmin",
      collectionId: "1",
      description: "test desc",
      ip: "1.1.1.1",
      fqdn: null,
      noncomputing: true,
      mac: null,
      labelNames: [],
      metadata: {},
      stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST","RHEL_7_STIG_TEST"],
      })
  }
  catch (e) {
    console.error('Error resetting scrap asset:', e)
    throw e
  }

}

const setRestrictedUsers = async (collectionId, grantId, body) => {

  const res = await fetch(`${config.baseUrl}/collections/${collectionId}/grants/${grantId}/acl`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const createUser = async (user) => {

  const res = await fetch(`${baseUrl}/users?elevate=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const putAsset = async (assetId, asset) => {

  const res = await fetch(`${baseUrl}/assets/${assetId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(asset)
  })
  if (!res.ok) { 
    // get the error message from the response if available
    const errorText = await res.text()
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const putCollection = async (collectionId, collection) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(collection)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const createCollectionLabel = async (collectionId, label) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(label)
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  return res.json()
}

const deleteReview = async (collectionId, assetId, ruleId) => {

  const res = await fetch(`${baseUrl}/collections/${collectionId}/reviews/${assetId}/${ruleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
  })
  if (!res.ok) { 
    throw new Error(`HTTP error, Status: ${res.status}`)
  }
  if(res.status === 204) {
    return { status: 204 }
  }
  return res.json()
}


export {
  deleteReview,
  createCollectionLabel,
  putCollection,
  conditionalMetricsOutput,
  putReviewByAssetRule,
  createUser,
  resetTestAsset,
  resetScrapAsset,
  setRestrictedUsers,
  loadAppData,
  exportAppData,
  loadAndExportAllAppData,
  deleteCollection,
  deleteAsset,
  putAsset,
  setDefaultRevision,
  createTempAsset,
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
  deleteStigByRevision,
  getUUIDSubString,
  executeRequest,
  outputMetricsToJSON
}

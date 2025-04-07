import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { readdir } from 'fs/promises'

const baseUrl = "http://localhost:64001/api"
const adminToken = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjIwNTc3ODc4MjgsImlhdCI6MTc0MjQyNzgyOCwiYXV0aF90aW1lIjoxNzQyNDI3MjIxLCJqdGkiOiJmYjA2NGI1NS1jODk2LTRlNTctYTY5Ny04ZWY0ZjE1M2NiNmQiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVhbG1zL3N0aWdtYW4iLCJzdWIiOiJiZjg3YTE2Zi0zOWU2LTQ2ZDktODk3MS1mMGVmNTFkZDNmODUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJzaWQiOiIzOGE3NDA5Yy00YTYzLTQzMTEtYWI2Mi01ZGU3OGY1NzNkNWMiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiY3JlYXRlX2NvbGxlY3Rpb24iLCJhZG1pbiJdfSwic2NvcGUiOiJzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOm9wIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlcjpzdGlnIiwibmFtZSI6IkFkbWluIEJ1cmtlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW4iLCJnaXZlbl9uYW1lIjoiQWRtaW4iLCJmYW1pbHlfbmFtZSI6IkJ1cmtlIn0.gT0EHb8wxKrv9McDdka1r_a2h5ZAUIYuEqgifrCOPcq7qlN1VEfstQPUZFMQ3iLisF33pxLnWDoQxSyw5HP5ftsQC3zN-O_NM9Q1MMNZGFEttNMaYRnBdoOWg9yrzu_4ys1fHRuj_T8orObhw1w3nOczkjoVLY0kA1TrC40huGU"

async function main() {
  try {
    // Get path from command line argument or use default
    const appdataPath = process.argv[2] || '../api/appdata'
    console.log(`Starting appdata update process for path: ${appdataPath}...`)
    const results = await loadAndExportAllAppData(appdataPath)
    
    console.log('\nSummary of results:')
    let successCount = 0
    let failureCount = 0
    
    results.forEach(result => {
      if (result.success) {
        successCount++
        console.log(`✅ ${result.file} -> ${result.outputPath}`)
      } else {
        failureCount++
        console.log(`❌ ${result.file}: ${result.error}`)
      }
    })
    
    console.log(`\nProcess completed: ${successCount} successful, ${failureCount} failed`)
  } catch (error) {
    console.error('Error during appdata update:', error)
    process.exit(1)
  }
}

main()

/**
 * Loads all appdata files from the appdata directory, then exports them as JSONL
 * @param {string} appdataDir - Directory containing appdata files (default: 'appdata')
 * @returns {Promise<Array>} - Results of processing each file
 */
async function loadAndExportAllAppData (appdataDir = '../api/appdata')
{

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const dirPath = join(__dirname, `${appdataDir}`)
  
  // Read all files in the directory
  const files = await readdir(dirPath)
  const results = []
  
  // Process each file
  for (const file of files) {
    try {
      console.log(`Loading ${file}...`)
      // Load the appdata file
      await loadAppData(appdataDir, file)
      
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

/**
 * Export application data as JSONL
 * @param {object} options - Options for exporting
 * @param {string} options.format - Format of the exported data (default: 'jsonl')
 * @returns {Promise<string>} - The exported data
 */
async function exportAppData (options = {})
{
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

async function loadAppData (appdataDir = '../api/appdata', appdataFileName = 'appdata.jsonl') 
{
 
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const filePath = join(__dirname, `${appdataDir}/${appdataFileName}`);
  
  const fileContent = await readFileSync(filePath, 'utf-8')
  
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
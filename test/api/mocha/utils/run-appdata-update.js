import { loadAndExportAllAppData } from './testUtils.js'

async function main() {
  try {
    console.log('Starting appdata update process...')
    const results = await loadAndExportAllAppData()
    
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

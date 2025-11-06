import { test as setup } from '@playwright/test'

setup('verify API is available', async ({ request }) => {
  // Optional: Verify your API is running before tests start
  try {
    const response = await request.get('http://localhost:64001/api/op/configuration')
    console.log('API is available:', response.ok())
  }
  catch (error) {
    console.warn('API may not be available:', error.message)
    console.warn('Tests will continue but may fail if API is not running')
  }
})

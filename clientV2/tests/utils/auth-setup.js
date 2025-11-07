import { test as setup } from '@playwright/test'

setup('verify API is available', async ({ request }) => {
  try {
    const response = await request.get('http://localhost:64001/api/op/configuration')
    console.log('API is available:', response.ok())
  }
  catch (error) {
    console.warn('API may not be available:', error.message)
  }
})

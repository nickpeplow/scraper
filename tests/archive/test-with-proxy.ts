// Test scraping with proxy
async function testWithProxy() {
  const baseUrl = 'http://localhost:3000'
  const apiKey = process.env.API_KEY || 'sk_8d3ba518f4f0560c7b3cf575fcf4e480f54b8dc861df5ac0a78f1b94a241ea4a'

  // Test creating a scrape job with proxy
  const createResponse = await fetch(`${baseUrl}/api/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      url: 'http://httpbin.org/ip',
      projectId: 'test-project-id',
      options: {
        useProxy: true,
        timeout: 30000,
      },
    }),
  })

  const createResult = await createResponse.json()
  console.log('Create job response:', createResult)

  if (createResult.jobId) {
    // Wait for job to complete
    let attempts = 0
    while (attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const statusResponse = await fetch(`${baseUrl}/api/jobs/${createResult.jobId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      })
      const statusResult = await statusResponse.json()

      console.log(`\nAttempt ${attempts + 1} - Status: ${statusResult.status}`)

      if (statusResult.status === 'completed' || statusResult.status === 'failed') {
        console.log('\nFinal result:', JSON.stringify(statusResult, null, 2))
        break
      }

      attempts++
    }
  }
}

testWithProxy().catch(console.error)

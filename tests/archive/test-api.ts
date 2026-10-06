/* eslint-disable no-console */
// Quick test script for the API
async function testAPI() {
  const baseUrl = 'http://localhost:3000'
  const apiKey = process.env.API_KEY || 'sk_8d3ba518f4f0560c7b3cf575fcf4e480f54b8dc861df5ac0a78f1b94a241ea4a'

  // Test creating a scrape job
  const createResponse = await fetch(`${baseUrl}/api/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      url: 'https://example.com',
      projectId: 'test-project-id',
      options: {
        useProxy: true,
        timeout: 15000,
      },
    }),
  })

  const createResult = await createResponse.json()
  console.log('Create job response:', JSON.stringify(createResult, null, 2))
  console.log('Status:', createResponse.status)

  if (createResult.jobId) {
    // Wait a bit then check status
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const statusResponse = await fetch(`${baseUrl}/api/jobs/${createResult.jobId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    })
    const statusResult = await statusResponse.json()
    console.log('Job status:', statusResult)
  }
}

testAPI().catch(console.error)

#!/usr/bin/env npx tsx

async function testRealtimeUpdates() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('Testing Real-time Updates...\n')

  try {
    // Get the first project
    console.log('1. Getting projects...')
    const projectsResponse = await fetch(`${baseUrl}/api/projects`)
    if (!projectsResponse.ok) {
      throw new Error(`Projects API failed: ${projectsResponse.status}`)
    }
    
    const projects = await projectsResponse.json()
    if (projects.length === 0) {
      throw new Error('No projects found. Please create a project first.')
    }
    
    const projectId = projects[0].id
    console.log(`   Using project: ${projects[0].name} (${projectId})`)

    // Submit a new job
    console.log('\n2. Submitting new scraping job...')
    const jobResponse = await fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://httpbin.org/delay/3',
        projectId: projectId,
        options: {
          useProxy: true,
          timeout: 10000
        }
      })
    })
    
    if (!jobResponse.ok) {
      const error = await jobResponse.text()
      throw new Error(`Failed to submit job: ${error}`)
    }
    
    const jobData = await jobResponse.json()
    console.log(`   Job submitted: ${jobData.jobId}`)
    console.log(`   Status: ${jobData.status}`)
    
    console.log('\n3. Open these pages to see real-time updates:')
    console.log(`   - Dashboard: ${baseUrl}/`)
    console.log(`   - Jobs List: ${baseUrl}/jobs`)
    console.log(`   - Job Details: ${baseUrl}/jobs/${jobData.jobId}`)
    
    console.log('\n4. Monitoring job status...')
    
    // Poll for job completion to show it's working
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max
    
    const checkStatus = async () => {
      const statusResponse = await fetch(`${baseUrl}/api/scrape/${jobData.jobId}/status`)
      if (!statusResponse.ok) {
        throw new Error('Failed to check job status')
      }
      
      const status = await statusResponse.json()
      return status
    }
    
    const interval = setInterval(async () => {
      attempts++
      const status = await checkStatus()
      
      process.stdout.write(`\r   Status: ${status.status} (${attempts}s)`)
      
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval)
        console.log(`\n\n✅ Job ${status.status}!`)
        
        if (status.status === 'completed' && status.result) {
          console.log(`   Status Code: ${status.result.statusCode}`)
          console.log(`   Execution Time: ${status.result.executionTime}ms`)
        } else if (status.status === 'failed' && status.result?.error) {
          console.log(`   Error: ${status.result.error}`)
        }
        
        console.log('\n📌 Check the web pages to see that they updated in real-time!')
        process.exit(0)
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        console.log('\n\n⚠️  Job is taking longer than expected')
        process.exit(1)
      }
    }, 1000)
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

console.log('Make sure you have:')
console.log('1. Next.js running: npm run dev')
console.log('2. Worker running: npm run worker:dev')
console.log('3. Open browser tabs for dashboard and jobs pages\n')

setTimeout(testRealtimeUpdates, 2000)
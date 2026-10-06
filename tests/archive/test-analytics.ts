#!/usr/bin/env npx tsx

async function testAnalytics() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('Testing Analytics API...\n')

  try {
    // Test analytics endpoint
    console.log('1. Fetching analytics data (last 7 days)...')
    const analyticsResponse = await fetch(`${baseUrl}/api/analytics?days=7`)
    
    if (!analyticsResponse.ok) {
      throw new Error(`Analytics request failed: ${analyticsResponse.status}`)
    }

    const analytics = await analyticsResponse.json()
    
    console.log('\nAnalytics Summary:')
    console.log(`- Total Jobs: ${analytics.summary.totalJobs}`)
    console.log(`- Success Rate: ${analytics.summary.successRate}%`)
    console.log(`- Completed: ${analytics.summary.completedJobs}`)
    console.log(`- Failed: ${analytics.summary.failedJobs}`)
    console.log(`- Pending: ${analytics.summary.pendingJobs}`)
    console.log(`- Avg Execution Time: ${analytics.summary.avgExecutionTime}ms`)
    
    console.log('\nJobs by Status:')
    analytics.jobsByStatus.forEach((item: any) => {
      console.log(`- ${item.status}: ${item.count}`)
    })
    
    console.log('\nTop Domains:')
    analytics.topDomains.slice(0, 5).forEach((item: any) => {
      console.log(`- ${item.domain || 'Unknown'}: ${item.count} requests`)
    })
    
    console.log('\n✅ Analytics API test passed!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testAnalytics()
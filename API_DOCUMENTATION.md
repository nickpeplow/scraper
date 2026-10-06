# Scraping API Documentation

## Authentication

All API endpoints require authentication using an API key. Include your API key in the request headers:

```
x-api-key: sk_your_api_key_here
```

### Generating API Keys

To generate an API key for a user:

```bash
npx tsx scripts/generate-api-key.ts user@example.com
```

This will:
- Create a new user if the email doesn't exist
- Generate a secure API key prefixed with `sk_`
- Display the API key (store it securely - it won't be shown again)

## API Endpoints

### 1. Submit Scraping Job

Create a new scraping job that will be processed asynchronously.

**Endpoint:** `POST /api/scrape`

**Headers:**
```
x-api-key: sk_your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "projectId": "your-project-id",
  "options": {
    "useProxy": true,
    "timeout": 30000,
    "headers": {
      "User-Agent": "Custom User Agent"
    }
  }
}
```

**Parameters:**
- `url` (required): The URL to scrape
- `projectId` (required): Your project ID (must belong to authenticated user)
- `options` (optional):
  - `useProxy`: Whether to use a proxy (default: true)
  - `timeout`: Request timeout in milliseconds (default: 30000)
  - `headers`: Custom headers to send with the request

**Success Response (200 OK):**
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "error": "Missing API key. Please provide an API key in the x-api-key header."
}
```

404 Not Found:
```json
{
  "error": "Project not found"
}
```

400 Bad Request:
```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["url"],
      "message": "Required"
    }
  ]
}
```

### 2. Check Job Status

Get the current status and results of a scraping job.

**Endpoint:** `GET /api/jobs/{jobId}`

**Headers:**
```
x-api-key: sk_your_api_key_here
```

**URL Parameters:**
- `jobId`: The ID of the job to check

**Success Response (200 OK):**

When job is pending/running:
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "events": [
    {
      "from": "pending",
      "to": "running",
      "timestamp": "2024-01-01T12:00:01.000Z",
      "details": {}
    }
  ]
}
```

When job is completed:
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "result": {
    "html": "<!DOCTYPE html>...",
    "statusCode": 200,
    "finalUrl": "https://example.com",
    "contentType": "text/html",
    "executionTime": 1234
  },
  "events": [
    {
      "from": "running",
      "to": "completed",
      "timestamp": "2024-01-01T12:00:05.000Z",
      "details": {
        "executionTime": 1234,
        "statusCode": 200
      }
    }
  ]
}
```

When job failed:
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "failed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "result": {
    "error": "Connection timeout",
    "errorType": "TIMEOUT_ERROR"
  },
  "events": [
    {
      "from": "running",
      "to": "failed",
      "timestamp": "2024-01-01T12:00:30.000Z",
      "details": {
        "error": "Connection timeout",
        "errorType": "TIMEOUT_ERROR"
      }
    }
  ]
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "error": "Invalid API key."
}
```

404 Not Found:
```json
{
  "error": "Job not found"
}
```

## Example Usage

### Node.js/JavaScript

```javascript
const API_KEY = 'sk_your_api_key_here';
const API_BASE = 'http://localhost:3000';

// Submit a scraping job
async function createScrapingJob(url, projectId) {
  const response = await fetch(`${API_BASE}/api/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      url: url,
      projectId: projectId,
      options: {
        useProxy: true,
        timeout: 30000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  return await response.json();
}

// Check job status
async function checkJobStatus(jobId) {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
    headers: {
      'x-api-key': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  return await response.json();
}

// Usage example
async function main() {
  try {
    // Create a job
    const job = await createScrapingJob('https://example.com', 'your-project-id');
    console.log('Job created:', job.jobId);

    // Poll for results
    let result;
    do {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      result = await checkJobStatus(job.jobId);
      console.log('Status:', result.status);
    } while (result.status === 'pending' || result.status === 'running');

    // Process results
    if (result.status === 'completed') {
      console.log('Scraped content:', result.result.html);
    } else {
      console.error('Job failed:', result.result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### cURL

Submit a scraping job:
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_your_api_key_here" \
  -d '{
    "url": "https://example.com",
    "projectId": "your-project-id",
    "options": {
      "useProxy": true
    }
  }'
```

Check job status:
```bash
curl http://localhost:3000/api/jobs/YOUR_JOB_ID \
  -H "x-api-key: sk_your_api_key_here"
```

### Python

```python
import requests
import time

API_KEY = 'sk_your_api_key_here'
API_BASE = 'http://localhost:3000'

headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
}

# Submit job
response = requests.post(
    f'{API_BASE}/api/scrape',
    headers=headers,
    json={
        'url': 'https://example.com',
        'projectId': 'your-project-id',
        'options': {
            'useProxy': True
        }
    }
)

job = response.json()
job_id = job['jobId']

# Poll for results
while True:
    time.sleep(2)
    response = requests.get(
        f'{API_BASE}/api/jobs/{job_id}',
        headers={'x-api-key': API_KEY}
    )
    result = response.json()
    
    if result['status'] in ['completed', 'failed']:
        break
    
    print(f"Status: {result['status']}")

# Process results
if result['status'] == 'completed':
    print(f"Content: {result['result']['html'][:100]}...")
else:
    print(f"Error: {result['result']['error']}")
```

## Error Types

The API may return the following error types in failed jobs:

- `TIMEOUT_ERROR`: Request exceeded the specified timeout
- `PROXY_ERROR`: Proxy connection failed
- `INVALID_URL`: The provided URL is malformed or invalid
- `BLOCKED_CONTENT`: The target site blocked the request
- `RATE_LIMIT_EXCEEDED`: Too many requests to the target site
- `NETWORK_ERROR`: General network connectivity issue
- `UNKNOWN_ERROR`: An unexpected error occurred

## Rate Limits

Currently, there are no rate limits implemented. This may change in future versions.

## Best Practices

1. **Always check job status** - Don't assume a job will complete immediately
2. **Implement exponential backoff** - When polling for job status, increase the delay between checks
3. **Handle errors gracefully** - Check for both HTTP errors and job failures
4. **Use appropriate timeouts** - Set timeouts based on the expected response time of target sites
5. **Store your API key securely** - Never commit API keys to version control
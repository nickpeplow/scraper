# Scraping API Requirements Document

## Project Overview
A Next.js-based API service that accepts URLs and returns scraped content, with built-in proxy support for reliability and scale.

## MVP Scope

### Core Functionality
- **Job-based architecture** - Accept request, return job ID
- **Simple HTTP fetching** (no JavaScript rendering)
- **Proxy rotation** to avoid rate limits and blocks
- **Job status endpoint** to check progress

### Technical Requirements

#### API Endpoint
```
POST /api/scrape
```

#### Request Schema
```json
{
  "url": "string (required)",
  "options": {
    "timeout": "number (default: 30000)",
    "useProxy": "boolean (default: true)",
    "headers": "object (optional)"
  }
}
```

#### Response Schema
```json
{
  "jobId": "string",
  "status": "queued",
  "timestamp": "ISO 8601 string"
}
```

#### Job Status Response (GET /api/jobs/{jobId})
```json
{
  "jobId": "string",
  "status": "queued|processing|completed|failed",
  "result": {
    "html": "string (when completed)",
    "error": "string (when failed)"
  },
  "timestamp": "ISO 8601 string"
}
```

### Infrastructure Components

#### 1. Scraping Engine
- **Simple HTTP client** (using Node.js fetch or axios)
- User-Agent rotation
- Header customization
- Response parsing (HTML/JSON)

#### 2. Proxy Management
- Integration with proxy provider (e.g., BrightData, SmartProxy, Oxylabs)
- Rotation strategy:
  - Per-request rotation
  - Sticky sessions for multi-page scraping
  - Geographic targeting support
- Fallback to direct connection on proxy failure

#### 3. Job Queue
- Redis-based job queue
- Job status tracking
- Result storage (temporary)

#### 4. Error Handling
- Structured error responses
- Retry logic with exponential backoff
- Dead letter queue for failed requests
- Common error types:
  - `TIMEOUT_ERROR`
  - `PROXY_ERROR`
  - `INVALID_URL`
  - `BLOCKED_CONTENT`
  - `RATE_LIMIT_EXCEEDED`

### Security
- API key authentication
- URL validation

### Performance
- Job queue handles concurrent requests
- Worker pool for processing

## Implementation Phases

### Phase 1: Basic Scraping (Week 1)
- [ ] Next.js project setup
- [ ] Basic `/api/scrape` endpoint
- [ ] HTTP client integration (fetch/axios)
- [ ] Simple HTML extraction

### Phase 2: Proxy Integration (Week 2)
- [ ] Proxy provider integration
- [ ] Rotation logic
- [ ] Error handling for proxy failures

### Phase 3: Production Ready (Week 3)
- [ ] Authentication system
- [ ] Performance optimization
- [ ] Deployment setup


## Technology Stack

### Core
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **HTTP Client**: Native fetch or axios
- **HTML Parsing**: cheerio (jQuery-like server-side DOM)
- **Database**: Redis (for caching & rate limiting)

### Supporting Libraries
- `bullmq` - Job queue management (handles queue, retries, scheduling)
- `zod` - Request validation

### Infrastructure
- **Hosting**: Vercel/AWS/Docker
- **Proxy Service**: TBD (BrightData, SmartProxy, etc.)
- **Monitoring**: Datadog/New Relic/Custom

## Cost Considerations
- Proxy costs: $X per GB or per request
- Server costs: Minimal (no browser instances)
- Storage: Job queue and results storage

## Future Enhancements
- **JavaScript rendering** (Puppeteer/Playwright)
- Dynamic content scraping
- Webhook support for async scraping
- Batch scraping endpoints
- Screenshot capture
- PDF generation
- Custom JavaScript execution
- Scheduled scraping jobs
- Result caching strategies
- Multi-region deployment
- Browser automation for complex sites

## Database Schema (PostgreSQL)

### users
- id (UUID, primary key)
- email (text, unique)
- api_key (text, unique)
- created_at (timestamp)
- updated_at (timestamp)

### projects
- id (UUID, primary key)
- user_id (UUID, foreign key → users)
- name (text)
- description (text)
- settings (jsonb) - default headers, proxies, etc.
- webhook_url (text) - project-level webhook
- created_at (timestamp)
- updated_at (timestamp)

### jobs
- id (UUID, primary key)
- user_id (UUID, foreign key → users)
- project_id (UUID, foreign key → projects)
- url (text)
- status (varchar) - pending/running/completed/failed
- priority (integer) - 1-10
- scheduled_at (timestamp)
- retry_count (integer)
- max_retries (integer)
- config (jsonb) - proxy settings, headers, timeout, etc.
- parent_job_id (UUID) - Links to original job for retries
- webhook_url (text) - URL to notify on completion (overrides project webhook)
- metadata (jsonb) - User-defined tags/labels
- created_at (timestamp)
- started_at (timestamp)
- completed_at (timestamp)

### job_results
- id (UUID, primary key)
- job_id (UUID, foreign key → jobs)
- scraped_data (jsonb)
- format (varchar) - json/csv/html
- response_status_code (integer)
- response_headers (jsonb)
- execution_time_ms (integer)
- data_size_bytes (bigint)
- proxy_id (UUID, foreign key → proxies)
- final_url (text)
- content_type (varchar)
- redirect_count (integer)
- server_ip (text)
- error_message (text)
- error_type (varchar)
- created_at (timestamp)

### proxies
- id (UUID, primary key)
- host (text)
- port (integer)
- username (text)
- password (text)
- protocol (varchar) - http/socks5
- proxy_type (varchar) - datacenter/residential/mobile
- provider (text) - webshare/brightdata/smartproxy/etc
- country_code (varchar) - US/UK/DE/etc
- status (varchar) - active/failed/blacklisted
- last_used_at (timestamp)
- failure_count (integer)
- success_count (integer)
- last_error (text) - Recent failure reason
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp) - Soft delete

### job_events
- id (UUID, primary key)
- job_id (UUID, foreign key → jobs)
- from_status (varchar)
- to_status (varchar)
- timestamp (timestamp)
- details (jsonb) - Error messages, worker info, etc.

## Frontend (Same Next.js App)

### Directory Structure
```
/app
  /api          # API routes only
    /scrape
    /jobs
    /auth
  /(dashboard)  # Frontend pages (grouped route)
    /layout.tsx
    /page.tsx   # Dashboard
    /jobs
    /proxies
    /settings
  /(public)     # Public pages
    /login
    /docs
/components     # Shared UI components
/lib
  /api         # API client functions
  /db          # Database queries
  /queue       # Job queue logic
```

### Frontend Pages
1. **Dashboard** (/)
   - Project selector/switcher
   - Active jobs count (per project)
   - Success/failure rates (per project)
   - Recent jobs list
   - Proxy health summary

2. **Submit Job** (/jobs/new)
   - Project selection
   - URL input
   - Proxy selection (inherit from project or override)
   - Headers configuration
   - Submit button

3. **Job Details** (/jobs/[id])
   - Status (real-time updates)
   - Result preview
   - Download options
   - Error details

4. **Proxy Management** (/proxies)
   - List all proxies
   - Import from file
   - Health statistics
   - Enable/disable proxies

5. **Projects** (/projects)
   - List all projects
   - Create new project
   - Edit project settings
   - View project statistics

6. **API Keys** (/settings/api-keys)
   - Generate new keys
   - View usage stats
   - Revoke keys

### Tech Stack
- **UI Library**: Shadcn/ui
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR or TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts or Tremor

## MVP Implementation Checklist

### 1. Project Setup
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Set up PostgreSQL database (local/Supabase/Neon)
- [ ] Set up Redis (local/Upstash)
- [ ] Configure environment variables
- [ ] Set up database migrations (Prisma/Drizzle)

### 2. Database Layer
- [ ] Create database schema
- [ ] Set up ORM/query builder
- [ ] Create seed script for test data
- [ ] Add database indexes

### 3. Core API Endpoints
- [ ] POST /api/scrape - Submit job
- [ ] GET /api/jobs/:id - Check job status
- [ ] Set up API key authentication middleware
- [ ] Add request validation with Zod

### 4. Job Queue System
- [ ] Set up BullMQ with Redis
- [ ] Create job processor worker
- [ ] Implement retry logic
- [ ] Add job status updates

### 5. Scraping Engine
- [ ] Implement HTTP client (axios/fetch)
- [ ] Add user-agent rotation
- [ ] Parse response metadata
- [ ] Handle redirects properly
- [ ] Extract final URL, content type, etc.

### 6. Proxy Integration
- [ ] Create proxy import script
- [ ] Implement proxy rotation logic
- [ ] Add proxy health tracking
- [ ] Handle proxy failures/fallback

### 7. Error Handling
- [ ] Define error types
- [ ] Implement structured error responses
- [ ] Add timeout handling
- [ ] Create dead letter queue

### 8. Testing
- [ ] Unit tests for core functions
- [ ] Integration tests for API endpoints
- [ ] Test proxy rotation
- [ ] Test error scenarios

### 9. Deployment
- [ ] Dockerize application
- [ ] Set up worker process
- [ ] Configure production database
- [ ] Set up monitoring/logging

### 10. Documentation
- [ ] API documentation
- [ ] Proxy setup guide
- [ ] Deployment instructions
- [ ] Example usage code

### 11. Frontend Development
- [ ] Set up Shadcn/ui and Tailwind
- [ ] Create layout with navigation
- [ ] Build job submission form
- [ ] Implement job status page
- [ ] Add proxy import feature
- [ ] Create API key management
- [ ] Add basic analytics dashboard

## Discussion Points
1. Proxy provider selection?
2. Job retention period?
3. Result size limits?
4. Worker scaling strategy?
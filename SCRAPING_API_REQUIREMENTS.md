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

#### Authentication

All API endpoints require authentication via API key:

```
Headers:
  x-api-key: sk_your_api_key_here
```

#### API Endpoints

##### 1. Submit Scraping Job

```
POST /api/scrape
```

**Request Headers:**
```
x-api-key: sk_your_api_key_here
Content-Type: application/json
```

**Request Schema**

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

**Response Schema**

```json
{
  "jobId": "string",
  "status": "pending",
  "timestamp": "ISO 8601 string"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Missing API key. Please provide an API key in the x-api-key header."
}
```

##### 2. Check Job Status

```
GET /api/jobs/{jobId}
```

**Request Headers:**
```
x-api-key: sk_your_api_key_here
```

**Job Status Response**

```json
{
  "jobId": "string",
  "status": "pending|running|completed|failed",
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

- **API key authentication** (implemented)
  - All endpoints require `x-api-key` header
  - API keys are prefixed with `sk_`
  - Users can only access their own projects and jobs
- **URL validation** (implemented via Zod)
- **Project ownership validation** (implemented)

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
- **Data Fetching**: TanStack Query
- **Forms**: TanStack Form + Zod
- **Tables**: TanStack Table
- **Virtual Lists**: TanStack Virtual (for large datasets)
- **Charts**: Recharts or Tremor
- **Type Safety**: Zod for runtime validation

## MVP Implementation Checklist

### ✅ Backend Status: COMPLETE

The core backend functionality is fully implemented and tested. The API is working with:

- Job queue processing
- Proxy rotation (96 proxies imported)
- Real-time status updates
- Error handling and retry logic
- API key authentication

### 🚧 Frontend Status: IN PROGRESS

The frontend development is underway with:

- Shadcn/ui component library configured
- Tailwind CSS v4 styling
- Navigation bar with responsive design
- Dashboard page with statistics
- Jobs list page with status filtering

### Running the Application:

1. Start Next.js server: `npm run dev`
2. Start worker: `npm run worker:dev`
3. Test API: `npx tsx tests/test-api.ts`
4. Access frontend: http://localhost:3000

### Current Frontend Structure:

```
/app
  /(dashboard)      # Authenticated pages with navbar
    /layout.tsx     # Dashboard layout with navigation
    /page.tsx       # Dashboard home with stats
    /jobs
      /page.tsx     # Jobs list with filtering
      /new          # (TODO) Create job form
      /[id]         # (TODO) Job details
  /api              # Backend API routes
/components
  /layout
    /navbar.tsx     # Top navigation bar
  /dashboard
    /stats-card.tsx # Statistics display cards
    /recent-jobs.tsx# Recent jobs list
  /jobs
    /job-table.tsx  # Jobs data table
  /ui               # Shadcn/ui components
```

## Detailed Implementation Progress

### 1. Project Setup

- [x] Initialize Next.js 15 project with TypeScript
- [x] Set up PostgreSQL database (local/Supabase/Neon)
- [x] Set up Redis (local/Upstash)
- [x] Configure environment variables
- [x] Set up database migrations (Prisma/Drizzle)

### 2. Database Layer

- [x] Create database schema
- [x] Set up ORM/query builder
- [x] Create seed script for test data
- [x] Add database indexes

### 3. Core API Endpoints

- [x] POST /api/scrape - Submit job
- [x] GET /api/jobs/:id - Check job status
- [x] Set up API key authentication middleware
- [x] Add request validation with Zod

### 4. Job Queue System

- [x] Set up BullMQ with Redis
- [x] Create job processor worker
- [x] Implement retry logic
- [x] Add job status updates

### 5. Scraping Engine

- [x] Implement HTTP client (axios/fetch)
- [x] Add user-agent rotation
- [x] Parse response metadata
- [x] Handle redirects properly
- [x] Extract final URL, content type, etc.

### 6. Proxy Integration

- [x] Create proxy import script
- [x] Implement proxy rotation logic
- [x] Add proxy health tracking
- [x] Handle proxy failures/fallback (retries with different proxy)

### 7. Error Handling

- [x] Define error types
- [x] Implement structured error responses
- [x] Add timeout handling
- [ ] Create dead letter queue

### 8. Testing

- [ ] Unit tests for core functions
- [x] Integration tests for API endpoints
- [x] Test proxy rotation
- [ ] Test error scenarios

### 9. Deployment

- [ ] Set up worker process
- [ ] Configure production database
- [ ] Set up monitoring/logging

### 10. Documentation

- [x] API documentation (see API_DOCUMENTATION.md)
- [ ] Proxy setup guide
- [ ] Deployment instructions
- [x] Example usage code

### 11. Frontend Development

- [x] Set up Shadcn/ui and Tailwind
- [x] Create layout with navigation
- [x] Add top navigation bar component
- [x] Build dashboard with statistics cards
- [x] Create jobs list page with filtering
- [x] Build job submission form
- [x] Implement job details page with live updates
- [x] Add projects management pages
- [x] Create project creation form
- [x] Add job status and result API endpoints
- [x] Create proxy management UI
- [x] Add proxy import feature
- [x] Create API key management
- [x] Create job analytics/charts
- [x] Add reusable JobsList component with tabs and search
- [x] Implement real API integration
  - [x] Replace mock getDashboardStats with API call
  - [x] Replace mock getJobs with API call  
  - [x] Replace mock getRecentJobs with API call
  - [x] Replace mock getJob with API call
  - [x] Add pagination support to jobs page
- [x] Implement real-time job status updates
  - [x] Create Server-Sent Events endpoint
  - [x] Update worker to publish events via Redis
  - [x] Create useRealtimeJobs hook
  - [x] Add progress indicators and animations
  - [x] Update dashboard with live updates
  - [x] Auto-refresh jobs list
  - [x] Replace polling with SSE on job details
- [ ] Add batch job submission
- [ ] Add webhook notifications
- [ ] Add toast notifications for job completions

## Discussion Points

1. Proxy provider selection?
2. Job retention period?
3. Result size limits?
4. Worker scaling strategy?

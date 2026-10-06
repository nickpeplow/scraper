import { createScrapeJobSchema } from '../lib/validations'

// Test the validation directly
try {
  const result = createScrapeJobSchema.parse({
    url: 'https://example.com',
    projectId: 'test-project-id',
    options: {
      useProxy: true,
      timeout: 15000,
    },
  })
  console.log('Validation passed:', result)
} catch (error) {
  console.error('Validation failed:', error)
}

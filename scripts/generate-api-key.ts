import { randomBytes } from 'crypto'
import { prisma } from '../lib/db'

async function generateApiKey() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: tsx scripts/generate-api-key.ts <email>')
    process.exit(1)
  }

  try {
    // Generate a secure random API key
    const apiKey = `sk_${randomBytes(32).toString('hex')}`

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      // Update existing user with new API key
      user = await prisma.user.update({
        where: { email },
        data: { apiKey },
      })
      console.log(`Updated API key for existing user: ${email}`)
    } else {
      // Create new user with API key
      user = await prisma.user.create({
        data: {
          email,
          apiKey,
        },
      })
      console.log(`Created new user: ${email}`)
    }

    console.log(`\nAPI Key: ${apiKey}`)
    console.log(`User ID: ${user.id}`)
    console.log('\nAdd this header to your API requests:')
    console.log(`x-api-key: ${apiKey}`)
  } catch (error) {
    console.error('Error generating API key:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

generateApiKey()

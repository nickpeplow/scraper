import { prisma } from '../lib/db'

async function createTestProject() {
  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    })

    if (!user) {
      console.error('Test user not found. Please run: npx tsx scripts/generate-api-key.ts test@example.com')
      process.exit(1)
    }

    // Check if project already exists
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: user.id,
        name: 'Default Project',
      },
    })

    if (existingProject) {
      console.log('Project already exists:', existingProject.id)
      return
    }

    // Update existing project with wrong user ID
    const updated = await prisma.project.upsert({
      where: { id: 'test-project-id' },
      update: {
        userId: user.id,
        name: 'Default Project',
        description: 'Default project for testing',
      },
      create: {
        id: 'test-project-id',
        userId: user.id,
        name: 'Default Project',
        description: 'Default project for testing',
        settings: {},
      },
    })

    console.log('Project updated/created successfully!')
    console.log('Project ID:', updated.id)
    console.log('Project Name:', updated.name)
    console.log('User ID:', updated.userId)
  } catch (error) {
    console.error('Error creating project:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestProject()
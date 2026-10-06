/* eslint-disable no-console */
import { prisma } from '../lib/db'

async function checkData() {
  const users = await prisma.user.findMany()
  console.log('Users:', users)

  const projects = await prisma.project.findMany()
  console.log('\nProjects:', projects)

  await prisma.$disconnect()
}

checkData().catch(console.error)

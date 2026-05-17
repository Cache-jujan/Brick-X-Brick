const prisma = require('../../config/db')

const createProject = async (gmId, { name, description, clientName, budget, startDate, endDate, items }) => {
  const project = await prisma.project.create({
    data: {
      name,
      description,
      clientName,
      budget,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null
    }
  })

  if (items?.length) {
    await prisma.ticket.createMany({
      data: items.map(item => ({
        projectId: project.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity || null,
        status: 'UNASSIGNED'
      }))
    })
  }

  return project
}

const getProjects = async (userId, role) => {
  const where = role === 'SITE_MANAGER'
    ? { members: { some: { userId } }, isActive: true }
    : { isActive: true }

  return prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
}

module.exports = { createProject, getProjects }
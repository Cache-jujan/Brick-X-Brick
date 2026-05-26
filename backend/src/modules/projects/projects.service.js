const prisma = require('../../config/db')

const createProject = async (gmId, { name, description, clientName, budget, startDate, endDate, items }) => {
  const project = await prisma.project.create({
    data: {
      createdBy:   gmId,
      name,
      description: description || null,
      clientName:  clientName || 'Unknown Client',
      budget,
      startDate:   new Date(startDate),
      endDate:     endDate ? new Date(endDate) : null,
      status:      'ACTIVE',
    }
  })

  // Each BOM item auto-generates a Material Request Ticket (F2 spec)
  if (items?.length) {
    await Promise.all(items.map(item =>
      prisma.ticket.create({
        data: {
          projectId:    project.id,
          submittedBy:  gmId,
          assignedTo:   gmId,           // placeholder — PM will reassign
          recipientRole: 'PURCHASER',
          type:         'MATERIAL_REQUEST',
          subject:      item.description?.slice(0, 100) || 'Material Request',
          description:  item.description || null,
          quantity:     item.quantity    || null,
          status:       'PENDING',
        }
      })
    ))
  }

  return project
}

const getProjects = async (userId, role) => {
  const where = role === 'SITE_MANAGER'
    ? { members: { some: { userId } }, status: 'ACTIVE' }
    : {}   // GM and PM see all projects

  return prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      creator:   { select: { id: true, name: true } },
      milestones: { select: { id: true, completionPct: true } },
      _count:    { select: { tickets: true, expenses: true } },
    }
  })
}

module.exports = { createProject, getProjects }
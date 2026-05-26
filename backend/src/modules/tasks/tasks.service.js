const prisma = require('../../config/db')

const createTask = async ({ milestoneId, projectId, name, assignedTo, dueDate }) => {
  const assignee = await prisma.user.findUnique({ where: { id: assignedTo } })
  if (!assignee || assignee.role !== 'SITE_MANAGER')
    throw Object.assign(new Error('assignedTo must be a SITE_MANAGER'), { status: 400 })

  return prisma.task.create({
    data: {
      milestoneId,
      projectId,
      name,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
    },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
    }
  })
}

const getTasks = async ({ milestoneId, assignedTo }) => {
  const where = {}
  if (milestoneId) where.milestoneId = milestoneId
  if (assignedTo)  where.assignedTo  = assignedTo

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, role: true } },
    }
  })
}

module.exports = { createTask, getTasks }
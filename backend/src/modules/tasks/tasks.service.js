const prisma = require('../../config/db')

const createTask = async ({ milestoneId, projectId, name, assignedTo, targetDate }) => {
  const assignee = await prisma.user.findUnique({ where: { id: assignedTo } })
  if (!assignee || assignee.role !== 'SITE_MANAGER')
    throw Object.assign(new Error('assignedTo must be a SITE_MANAGER'), { status: 400 })

  return prisma.task.create({
    data: {
      milestoneId,
      projectId,
      name,
      assignedTo,
      targetDate: targetDate ? new Date(targetDate) : null
    }
  })
}

const getTasks = async ({ milestoneId, assignedTo }) => {
  const where = {}
  if (milestoneId) where.milestoneId = milestoneId
  if (assignedTo) where.assignedTo = assignedTo
  return prisma.task.findMany({ where })
}

module.exports = { createTask, getTasks }

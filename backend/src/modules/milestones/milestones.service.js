const prisma = require('../../config/db')

const createMilestone = async ({ projectId, name, targetDate, createdBy }) => {
  return prisma.milestone.create({
    data: {
      projectId,
      createdBy,
      name,
      targetDate: new Date(targetDate),
      status: 'ON_TRACK',
    }
  })
}

const getMilestones = async (projectId) => {
  return prisma.milestone.findMany({
    where: { projectId },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, role: true } },
        }
      }
    },
    orderBy: { createdAt: 'asc' },
  })
}

const recalculateMilestone = async (milestoneId) => {
  const tasks = await prisma.task.findMany({ where: { milestoneId } })
  const avg = tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + t.completionPct, 0) / tasks.length)
    : 0

  // Update milestone status based on completion and due date
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } })
  let status = 'ON_TRACK'
  if (avg === 100) {
    status = 'COMPLETED'
  } else if (milestone && new Date(milestone.targetDate) < new Date()) {
    status = 'OVERDUE'
  } else if (milestone && avg < 50 && new Date(milestone.targetDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
    status = 'AT_RISK'
  }

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      completionPct: avg,
      status,
      completedAt: avg === 100 ? new Date() : null,
    }
  })
  return avg
}

const recalculateProject = async (projectId) => {
  const milestones = await prisma.milestone.findMany({ where: { projectId } })
  const avg = milestones.length
    ? Math.round(milestones.reduce((sum, m) => sum + m.completionPct, 0) / milestones.length)
    : 0
  await prisma.project.update({ where: { id: projectId }, data: { completionPct: avg } })
  return avg
}

module.exports = { createMilestone, getMilestones, recalculateMilestone, recalculateProject }
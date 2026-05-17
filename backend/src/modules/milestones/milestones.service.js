const prisma = require('../../config/db')

const createMilestone = async ({ projectId, name, targetDate }) => {
  return prisma.milestone.create({
    data: { projectId, name, targetDate: new Date(targetDate) }
  })
}

const getMilestones = async (projectId) => {
  return prisma.milestone.findMany({
    where: { projectId },
    include: { tasks: true }
  })
}

const recalculateMilestone = async (milestoneId) => {
  const tasks = await prisma.task.findMany({ where: { milestoneId } })
  const avg = tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + t.completionPct, 0) / tasks.length)
    : 0
  await prisma.milestone.update({ where: { id: milestoneId }, data: { completionPct: avg } })
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

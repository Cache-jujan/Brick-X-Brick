const prisma = require('../../config/db')
const { recalculateMilestone, recalculateProject } = require('../milestones/milestones.service')

const createTaskUpdate = async ({ taskId, submittedBy, completionPct, issueText }) => {
  if (completionPct < 0 || completionPct > 100)
    throw Object.assign(new Error('completionPct must be between 0 and 100'), { status: 400 })

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { milestone: true }
  })
  if (!task)
    throw Object.assign(new Error('Task not found'), { status: 404 })

  await prisma.taskUpdate.create({
    data: { taskId, submittedBy, completionPct, issueText: issueText ?? null }
  })

  await prisma.task.update({
    where: { id: taskId },
    data: { completionPct }
  })

  const milestonePct = await recalculateMilestone(task.milestoneId)
  await recalculateProject(task.projectId)

  return { taskId, completionPct, milestonePct }
}

module.exports = { createTaskUpdate }

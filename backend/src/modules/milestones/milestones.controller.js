const { createMilestone, getMilestones } = require('./milestones.service')

const create = async (req, res) => {
  try {
    const { projectId, name, targetDate } = req.body
    if (!projectId || !name || !targetDate)
      return res.status(400).json({ error: 'projectId, name, and targetDate are required' })

    const milestone = await createMilestone({
      projectId,
      name,
      targetDate,
      createdBy: req.dbUser.id,
    })
    res.status(201).json(milestone)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const list = async (req, res) => {
  try {
    const { projectId } = req.query
    if (!projectId)
      return res.status(400).json({ error: 'projectId query param is required' })

    const milestones = await getMilestones(projectId)
    res.json(milestones)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { create, list }
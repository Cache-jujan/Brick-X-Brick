const { createTask, getTasks } = require('./tasks.service')

const create = async (req, res) => {
  try {
    const { milestoneId, projectId, name, assignedTo, targetDate } = req.body
    if (!milestoneId || !projectId || !name || !assignedTo)
      return res.status(400).json({ error: 'milestoneId, projectId, name, and assignedTo are required' })

    const task = await createTask({ milestoneId, projectId, name, assignedTo, targetDate })
    res.status(201).json(task)
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message })
    res.status(500).json({ error: err.message })
  }
}

const list = async (req, res) => {
  try {
    const { milestoneId, assignedTo } = req.query
    const tasks = await getTasks({ milestoneId, assignedTo })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { create, list }

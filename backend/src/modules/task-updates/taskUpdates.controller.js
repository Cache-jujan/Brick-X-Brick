const { createTaskUpdate } = require('./taskUpdates.service')

const create = async (req, res) => {
  try {
    const { taskId, completionPct, issueText } = req.body
    if (!taskId || completionPct === undefined)
      return res.status(400).json({ error: 'taskId and completionPct are required' })

    const result = await createTaskUpdate({
      taskId,
      submittedBy: req.dbUser.id,
      completionPct,
      issueText
    })
    res.status(201).json(result)
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message })
    if (err.status === 404) return res.status(404).json({ error: err.message })
    res.status(500).json({ error: err.message })
  }
}

module.exports = { create }

const { createRequest, getRequests, updateStatus } = require('./materialRequests.service')

const create = async (req, res) => {
  try {
    const { projectId, items, urgency, notes } = req.body
    if (!projectId || !items) 
      return res.status(400).json({ error: 'projectId and items are required' })

    const request = await createRequest(req.dbUser.id, { projectId, items, urgency, notes })
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const list = async (req, res) => {
  try {
    const { projectId } = req.query
    if (!projectId) 
      return res.status(400).json({ error: 'projectId is required' })

    const requests = await getRequests(projectId)
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const patchStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!status) 
      return res.status(400).json({ error: 'status is required' })

    const updated = await updateStatus(id, status)
    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

module.exports = { create, list, patchStatus }
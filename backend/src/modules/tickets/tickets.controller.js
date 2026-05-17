const { getTickets, assignTicket } = require('./tickets.service')

const list = async (req, res) => {
  try {
    const { projectId, status } = req.query
    if (!projectId) return res.status(400).json({ error: 'projectId is required' })

    const tickets = await getTickets(projectId, status)
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const assign = async (req, res) => {
  try {
    const { id } = req.params
    const { assignedTo } = req.body
    if (!assignedTo) return res.status(400).json({ error: 'assignedTo is required' })

    const ticket = await assignTicket(id, assignedTo)
    res.json(ticket)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

module.exports = { list, assign }
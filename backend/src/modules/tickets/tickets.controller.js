const { 
  getTickets, 
  assignTicket, 
  getTicketById,
  resolveTicket, 
  rejectTicket,
  createTicket
} = require('./tickets.service')

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

const resolve = async (req, res) => {
  try {
    const ticket = await resolveTicket(req.params.id)
    res.json(ticket)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const reject = async (req, res) => {
  try {
    const ticket = await rejectTicket(req.params.id)
    res.json(ticket)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const create = async (req, res) => {
  try {
    const { projectId, type, description, quantity } = req.body
    const submittedBy = req.user.id
    if (!projectId) return res.status(400).json({ error: 'projectId is required' })
    if (!type) return res.status(400).json({ error: 'type is required' })
    if (!description?.trim()) return res.status(400).json({ error: 'description is required' })
    if (!['MATERIAL_REQUEST', 'WORK_ITEM'].includes(type)) {
      return res.status(400).json({ error: 'type must be MATERIAL_REQUEST or WORK_ITEM' })
    }
    const ticket = await createTicket({ projectId, type, description, quantity, submittedBy })
    res.status(201).json(ticket)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

module.exports = { list, assign, resolve, reject, create }
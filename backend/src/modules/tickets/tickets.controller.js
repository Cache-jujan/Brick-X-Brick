const {
  getTickets,
  getTicketById,
  createTicket,
  resolveTicket,
  rejectTicket,
} = require('./tickets.service')

// GET /api/tickets?projectId=&status=
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

// GET /api/tickets/:id
const get = async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    res.json(ticket)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/tickets — PM creates a ticket
const create = async (req, res) => {
  try {
    const { projectId, type, subject, description, quantity, assignedTo, photoURL } = req.body
    const submittedBy = req.dbUser.id

    if (!projectId)   return res.status(400).json({ error: 'projectId is required' })
    if (!type)        return res.status(400).json({ error: 'type is required' })
    if (!subject?.trim()) return res.status(400).json({ error: 'subject is required' })
    if (!assignedTo)  return res.status(400).json({ error: 'assignedTo is required' })
    if (!['MATERIAL_REQUEST', 'WORK_ITEM'].includes(type)) {
      return res.status(400).json({ error: 'type must be MATERIAL_REQUEST or WORK_ITEM' })
    }

    const ticket = await createTicket({ projectId, type, subject, description, quantity, assignedTo, submittedBy, photoURL })
    res.status(201).json(ticket)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
}

// PATCH /api/tickets/:id/resolve — PM resolves
const resolve = async (req, res) => {
  try {
    const ticket = await resolveTicket(req.params.id, req.dbUser.id)
    res.json(ticket)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
}

// PATCH /api/tickets/:id/reject — PM rejects
const reject = async (req, res) => {
  try {
    const ticket = await rejectTicket(req.params.id, req.dbUser.id)
    res.json(ticket)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
}

module.exports = { list, get, create, resolve, reject }
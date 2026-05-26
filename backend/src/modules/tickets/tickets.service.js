const prisma = require('../../config/db')

// ─── GET tickets for a project (optional status filter) ──────────────────────

const getTickets = async (projectId, status) => {
  return prisma.ticket.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
    },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      assignee:  { select: { id: true, name: true, role: true } },
      resolver:  { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ─── GET a single ticket ──────────────────────────────────────────────────────

const getTicketById = async (ticketId) => {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      assignee:  { select: { id: true, name: true, role: true } },
      resolver:  { select: { id: true, name: true, role: true } },
    },
  })
}

// ─── POST — PM creates a ticket ───────────────────────────────────────────────
// Per manuscript: PM submits ticket with type, subject, description, assignedTo
// Ticket routing: MATERIAL_REQUEST → PURCHASER, WORK_ITEM → SITE_MANAGER

const createTicket = async ({ projectId, type, subject, description, quantity, assignedTo, submittedBy, photoURL }) => {
  // Validate assignee role matches ticket type
  const assignee = await prisma.user.findUnique({ where: { id: assignedTo } })
  if (!assignee) throw Object.assign(new Error('Assignee not found'), { status: 404 })

  const requiredRole = type === 'MATERIAL_REQUEST' ? 'PURCHASER' : 'SITE_MANAGER'
  if (assignee.role !== requiredRole) {
    throw Object.assign(
      new Error(`${type === 'MATERIAL_REQUEST' ? 'Material Request' : 'Work Item'} tickets must be assigned to a ${requiredRole}`),
      { status: 400 }
    )
  }

  return prisma.ticket.create({
    data: {
      projectId,
      submittedBy,
      assignedTo,
      recipientRole: requiredRole,
      type,
      subject,
      description: description ?? null,
      quantity:    quantity    ?? null,
      photoURL:    photoURL    ?? null,
      status: 'PENDING',
    },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      assignee:  { select: { id: true, name: true, role: true } },
    },
  })
}

// ─── PATCH — PM resolves a ticket ─────────────────────────────────────────────

const resolveTicket = async (ticketId, resolvedBy) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { status: 404 })
  if (ticket.status !== 'PENDING') {
    throw Object.assign(new Error(`Cannot resolve a ticket with status: ${ticket.status}`), { status: 400 })
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status:     'RESOLVED',
      resolvedBy,
      resolvedAt: new Date(),
      updatedAt:  new Date(),
    },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      assignee:  { select: { id: true, name: true, role: true } },
      resolver:  { select: { id: true, name: true, role: true } },
    },
  })
}

// ─── PATCH — PM rejects a ticket ──────────────────────────────────────────────

const rejectTicket = async (ticketId, resolvedBy) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { status: 404 })
  if (ticket.status !== 'PENDING') {
    throw Object.assign(new Error(`Cannot reject a ticket with status: ${ticket.status}`), { status: 400 })
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status:     'REJECTED',
      resolvedBy,
      resolvedAt: new Date(),
      updatedAt:  new Date(),
    },
    include: {
      submitter: { select: { id: true, name: true, role: true } },
      assignee:  { select: { id: true, name: true, role: true } },
      resolver:  { select: { id: true, name: true, role: true } },
    },
  })
}

module.exports = { getTickets, getTicketById, createTicket, resolveTicket, rejectTicket }
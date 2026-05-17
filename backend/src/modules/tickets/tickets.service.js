const prisma = require('../../config/db')

const getTickets = async (projectId, status) => {
  return prisma.ticket.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
    },
    include: {
      assignee: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

const assignTicket = async (ticketId, assignedToId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket not found')
  if (ticket.status !== 'UNASSIGNED') throw new Error('Ticket already assigned')

  const assignee = await prisma.user.findUnique({ where: { id: assignedToId } })
  if (!assignee) throw new Error('Assignee not found')

  const validRole = ticket.type === 'MATERIAL_REQUEST' ? 'PURCHASER' : 'SITE_MANAGER'
  if (assignee.role !== validRole) throw new Error(`Must assign to a ${validRole}`)

  return prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedTo: assignedToId, status: 'PENDING' },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
    },
  })
}

module.exports = { getTickets, assignTicket }
const prisma = require('../../config/db')

const VALID_TRANSITIONS = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PURCHASED', 'REJECTED'],
  PURCHASED: ['DELIVERED'],
  DELIVERED: [],
  REJECTED: []
}

const createRequest = async (userId, { projectId, items, urgency, notes }) => {
  return await prisma.materialRequest.create({
    data: {
      projectId,
      userId,
      items,
      urgency: urgency || 'NORMAL',
      notes
    }
  })
}

const getRequests = async (projectId) => {
  return await prisma.materialRequest.findMany({
    where: { projectId },
    include: { requestedBy: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'desc' }
  })
}

const updateStatus = async (id, newStatus) => {
  const request = await prisma.materialRequest.findUnique({ where: { id } })
  if (!request) throw new Error('Request not found')

  const valid = VALID_TRANSITIONS[request.status]
  if (!valid.includes(newStatus))
    throw new Error(`Invalid transition: ${request.status} -> ${newStatus}`)

  return await prisma.materialRequest.update({
    where: { id },
    data: { status: newStatus }
  })
}

module.exports = { createRequest, getRequests, updateStatus }
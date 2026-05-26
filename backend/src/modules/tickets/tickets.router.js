const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { list, assign, resolve, reject, create } = require('./tickets.controller')

// GET /api/tickets?projectId=&status=
router.get('/', verifyToken, requireRole(['PROJECT_MANAGER', 'GENERAL_MANAGER', 'PURCHASER', 'SITE_MANAGER']), list)

// POST /api/tickets — PM creates a new ticket
router.post('/', verifyToken, requireRole(['PROJECT_MANAGER']), create)

// PATCH /api/tickets/:id/assign — PM assigns UNASSIGNED ticket
router.patch('/:id/assign', verifyToken, requireRole(['PROJECT_MANAGER']), assign)

// PATCH /api/tickets/:id/resolve — PM resolves PENDING ticket
router.patch('/:id/resolve', verifyToken, requireRole(['PROJECT_MANAGER']), resolve)

// PATCH /api/tickets/:id/reject — PM rejects PENDING ticket
router.patch('/:id/reject', verifyToken, requireRole(['PROJECT_MANAGER']), reject)

module.exports = router
const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { list, get, create, resolve, reject } = require('./tickets.controller')

const PM_GM = ['PROJECT_MANAGER', 'GENERAL_MANAGER']
const ALL_ROLES = ['PROJECT_MANAGER', 'GENERAL_MANAGER', 'PURCHASER', 'SITE_MANAGER', 'SYS_ADMIN']

// GET /api/tickets?projectId=&status=
router.get('/', verifyToken, requireRole(ALL_ROLES), list)

// GET /api/tickets/:id
router.get('/:id', verifyToken, requireRole(ALL_ROLES), get)

// POST /api/tickets — PM creates ticket
router.post('/', verifyToken, requireRole(['PROJECT_MANAGER']), create)

// PATCH /api/tickets/:id/resolve — PM resolves
router.patch('/:id/resolve', verifyToken, requireRole(PM_GM), resolve)

// PATCH /api/tickets/:id/reject — PM rejects
router.patch('/:id/reject', verifyToken, requireRole(PM_GM), reject)

module.exports = router
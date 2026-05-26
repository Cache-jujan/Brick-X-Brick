const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { list, get, submit, approve, reject, split } = require('./expenses.controller')

const SUBMITTERS  = ['PURCHASER', 'GENERAL_MANAGER', 'PROJECT_MANAGER']
const APPROVERS   = ['PROJECT_MANAGER', 'GENERAL_MANAGER']
const ALL_MEMBERS = ['PURCHASER', 'GENERAL_MANAGER', 'PROJECT_MANAGER', 'SITE_MANAGER']

// GET /api/expenses?projectId=&status=
router.get('/', verifyToken, requireRole(ALL_MEMBERS), list)

// GET /api/expenses/:id
router.get('/:id', verifyToken, requireRole(ALL_MEMBERS), get)

// POST /api/expenses — F6 submit (multipart)
router.post('/', verifyToken, requireRole(SUBMITTERS), submit)

// PATCH /api/expenses/:id/approve — PM/GM approves → triggers F12
router.patch('/:id/approve', verifyToken, requireRole(APPROVERS), approve)

// PATCH /api/expenses/:id/reject — PM/GM rejects
router.patch('/:id/reject', verifyToken, requireRole(APPROVERS), reject)

// POST /api/expenses/:id/split-allocate — F8 split
router.post('/:id/split-allocate', verifyToken, requireRole(SUBMITTERS), split)

module.exports = router
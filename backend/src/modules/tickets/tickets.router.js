const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { list, assign } = require('./tickets.controller')

router.get('/', verifyToken, requireRole(['PROJECT_MANAGER', 'GENERAL_MANAGER', 'PURCHASER', 'SITE_MANAGER']), list)
router.patch('/:id/assign', verifyToken, requireRole(['PROJECT_MANAGER']), assign)

module.exports = router
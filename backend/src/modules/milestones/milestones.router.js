const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { create, list } = require('./milestones.controller')

router.post('/', verifyToken, requireRole(['PROJECT_MANAGER']), create)
router.get('/', verifyToken, requireRole(['PROJECT_MANAGER', 'SITE_MANAGER']), list)

module.exports = router

const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { create } = require('./taskUpdates.controller')

router.post('/', verifyToken, requireRole(['SITE_MANAGER', 'PROJECT_MANAGER']), create)

module.exports = router

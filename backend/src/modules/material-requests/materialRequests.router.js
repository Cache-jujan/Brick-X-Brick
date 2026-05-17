const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { create, list, patchStatus } = require('./materialRequests.controller')

router.post('/', verifyToken, requireRole(['SITE_MANAGER']), create)
router.get('/', verifyToken, list)
router.patch('/:id/status', verifyToken, requireRole(['PURCHASER']), patchStatus)

module.exports = router
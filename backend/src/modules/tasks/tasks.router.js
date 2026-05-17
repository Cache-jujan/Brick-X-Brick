const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { create, list } = require('./tasks.controller')

router.post('/', verifyToken, requireRole(['PROJECT_MANAGER']), create)
router.get('/', verifyToken, list)

module.exports = router

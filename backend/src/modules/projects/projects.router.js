const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { create, list } = require('./projects.controller')

router.post('/', verifyToken, requireRole(['GENERAL_MANAGER']), create)
router.get('/', verifyToken, list)

module.exports = router
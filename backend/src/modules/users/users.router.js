const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const { list } = require('./users.controller')

router.get('/', verifyToken, requireRole(['PROJECT_MANAGER', 'GENERAL_MANAGER']), list)

module.exports = router
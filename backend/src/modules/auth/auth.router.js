const router = require('express').Router()
const { verifyToken } = require('../../middleware/auth')
const { sync, me } = require('./auth.controller')

router.post('/sync', verifyToken, sync)
router.get('/me', verifyToken, me)

module.exports = router
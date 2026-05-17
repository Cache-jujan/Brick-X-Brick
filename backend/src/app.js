const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use('/api/auth', require('./modules/auth/auth.router'))
app.use('/api/material-requests', require('./modules/material-requests/materialRequests.router'))
app.use('/api/projects', require('./modules/projects/projects.router'))
app.use('/api/users', require('./modules/users/users.router'))
app.use('/api/tickets', require('./modules/tickets/tickets.router'))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

module.exports = app
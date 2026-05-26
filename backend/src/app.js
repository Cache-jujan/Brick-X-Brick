const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',             require('./modules/auth/auth.router'))
app.use('/api/users',            require('./modules/users/users.router'))
app.use('/api/projects',         require('./modules/projects/projects.router'))
app.use('/api/milestones',       require('./modules/milestones/milestones.router'))
app.use('/api/tasks',            require('./modules/tasks/tasks.router'))
app.use('/api/task-updates',     require('./modules/task-updates/taskUpdates.router'))
app.use('/api/tickets',          require('./modules/tickets/tickets.router'))
app.use('/api/expenses',         require('./modules/expenses/expenses.router'))
app.use('/api/reports',          require('./modules/reports/reports.router'))
app.use('/api/blockchain',       require('./modules/blockchain/blockchain.router'))

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

module.exports = app
const router = require('express').Router()
const { verifyToken, requireRole } = require('../../middleware/auth')
const crypto  = require('crypto')
const prisma  = require('../../config/db')

// GET /api/blockchain/verify/:expenseId
// GM triggers tamper verification: recomputes SHA-256 from current DB record,
// compares against stored txHash in BlockchainLog
router.get('/verify/:expenseId', verifyToken, requireRole(['GENERAL_MANAGER']), async (req, res) => {
  try {
    const { expenseId } = req.params

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { blockchainLogs: { orderBy: { timestamp: 'desc' }, take: 1 } },
    })

    if (!expense) return res.status(404).json({ error: 'Expense not found' })

    const log = expense.blockchainLogs[0]
    if (!log) return res.status(404).json({ error: 'No blockchain record found for this expense' })

    // Recompute SHA-256 from canonical JSON of the expense record
    const canonicalData = JSON.stringify({
      id:                 expense.id,
      projectId:          expense.projectId,
      submittedBy:        expense.submittedBy,
      vendorName:         expense.vendorName,
      amount:             expense.amount.toString(),
      receiptDate:        expense.receiptDate,
      category:           expense.category,
      birValidationStatus: expense.birValidationStatus,
      birNumber:          expense.birNumber,
      quantity:           expense.quantity.toString(),
      status:             expense.status,
      submittedAt:        expense.submittedAt,
    })

    const recomputedHash = `0x${crypto.createHash('sha256').update(canonicalData).digest('hex')}`

    // Compare against stored txHash
    // NOTE: In production Iteration 12, the txHash stored is the Geth transaction hash,
    // not the SHA-256 of the expense. The full flow: SHA-256(expense) → submit to Geth →
    // store Geth's returned txHash. Verification then queries the on-chain record.
    // For now (stub), we compare the recomputed hash against what was stored.
    const tampered = recomputedHash !== log.txHash

    res.json({
      expenseId,
      verified: !tampered,
      status:   tampered ? 'TAMPER_ALERT' : 'RECORD_VERIFIED',
      message:  tampered
        ? 'Tamper Alert: The expense record has been modified after blockchain recording.'
        : 'Record Verified — No tampering detected.',
      txHash:      log.txHash,
      blockNumber: log.blockNumber,
      timestamp:   log.timestamp,
      recomputedHash,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/blockchain/audit-logs?projectId=
// GM views all blockchain logs for a project
router.get('/audit-logs', verifyToken, requireRole(['GENERAL_MANAGER']), async (req, res) => {
  try {
    const { projectId } = req.query

    const logs = await prisma.blockchainLog.findMany({
      where: projectId ? { expense: { projectId } } : {},
      include: {
        expense: {
          select: {
            id:        true,
            vendorName: true,
            amount:    true,
            status:    true,
            projectId: true,
          },
        },
        actor: { select: { id: true, name: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
    })

    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
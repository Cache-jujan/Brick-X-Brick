const {
  submitExpense,
  getExpenses,
  getExpenseById,
  approveExpense,
  rejectExpense,
  splitAllocate,
} = require('./expenses.service')

// GET /api/expenses?projectId=&status=
const list = async (req, res) => {
  try {
    const { projectId, status } = req.query
    if (!projectId) return res.status(400).json({ error: 'projectId is required' })
    const expenses = await getExpenses({ projectId, status })
    res.json(expenses)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/expenses/:id
const get = async (req, res) => {
  try {
    const expense = await getExpenseById(req.params.id)
    if (!expense) return res.status(404).json({ error: 'Expense not found' })
    res.json(expense)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/expenses — multipart/form-data (Purchaser / GM / PM)
// receiptImageURL comes from Multer after upload middleware handles the file
const submit = async (req, res) => {
  try {
    const {
      projectId, ticketId, vendorName, amount, receiptDate,
      category, birNumber, quantity, tin, birPermitNumber,
    } = req.body

    if (!projectId)      return res.status(400).json({ error: 'projectId is required' })
    if (!vendorName)     return res.status(400).json({ error: 'vendorName is required' })
    if (!amount)         return res.status(400).json({ error: 'amount is required' })
    if (!receiptDate)    return res.status(400).json({ error: 'receiptDate is required' })
    if (!category)       return res.status(400).json({ error: 'category is required' })

    // receiptImageURL is set by upload middleware (Multer → Cloudflare R2)
    // For now, fall back to a placeholder if no file middleware is set up yet
    const receiptImageURL = req.file?.path ?? req.body.receiptImageURL ?? 'pending-upload'

    const result = await submitExpense({
      projectId,
      submittedBy: req.dbUser.id,
      ticketId:    ticketId    ?? null,
      vendorName,
      amount:      parseFloat(amount),
      receiptDate,
      category,
      receiptImageURL,
      birNumber:   birNumber   ?? null,
      quantity:    parseFloat(quantity ?? 1),
      tin:         tin         ?? null,
      birPermitNumber: birPermitNumber ?? null,
    })

    res.status(201).json(result)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
}

// PATCH /api/expenses/:id/approve — PM approves
const approve = async (req, res) => {
  try {
    const expense = await approveExpense(req.params.id, req.dbUser.id)
    res.json(expense)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
}

// PATCH /api/expenses/:id/reject — PM rejects
const reject = async (req, res) => {
  try {
    const expense = await rejectExpense(req.params.id, req.dbUser.id)
    res.json(expense)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
}

// POST /api/expenses/:id/split-allocate — F8 Split Receipt (Purchaser / GM / PM)
const split = async (req, res) => {
  try {
    const { allocations } = req.body
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ error: 'allocations array is required' })
    }
    const result = await splitAllocate(req.params.id, allocations, req.dbUser.id)
    res.status(201).json(result)
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ error: err.message })
  }
}

module.exports = { list, get, submit, approve, reject, split }
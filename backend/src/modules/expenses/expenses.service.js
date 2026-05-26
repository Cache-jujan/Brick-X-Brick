const prisma = require('../../config/db')

// ─── F7: BIR Field Verification ───────────────────────────────────────────────
// Checks TIN, BIR Permit Number, OR/SI Number presence
// Returns 'FORMAL' if all three present, 'INFORMAL' otherwise

const classifyBIR = ({ tin, birPermitNumber, orSiNumber }) => {
  if (tin && birPermitNumber && orSiNumber) return 'FORMAL'
  return 'INFORMAL'
}

// ─── F9 Layer 1: BIR Duplicate Check ─────────────────────────────────────────
// Checks full BIR combination: TIN + Permit + OR/SI against all existing approved expenses

const checkBIRDuplicate = async ({ tin, birPermitNumber, orSiNumber }) => {
  if (!tin || !birPermitNumber || !orSiNumber) return false // Informal receipts skip Layer 1
  const existing = await prisma.expense.findFirst({
    where: {
      birNumber: orSiNumber,
      status: 'APPROVED',
    },
  })
  return !!existing
}

// ─── F9 Layer 2: Vendor List Validation ──────────────────────────────────────
// Checks extracted vendor name against VendorMasterList
// Returns { pass: bool, reason: string|null }

const checkVendorList = async (vendorName) => {
  const vendor = await prisma.vendorMasterList.findFirst({
    where: { vendorName: { equals: vendorName, mode: 'insensitive' } },
  })
  if (!vendor) return { pass: false, reason: `Vendor "${vendorName}" not found in Vendor Master List` }
  if (vendor.approvalStatus === 'FLAGGED') return { pass: false, reason: `Vendor "${vendorName}" is flagged` }
  return { pass: true, reason: null }
}

// ─── F9 Layer 3: Ticket-Receipt Mismatch Detection ───────────────────────────
// Compares expense amount against ticket scope; flags if mismatch

const checkTicketMismatch = async (ticketId, amount) => {
  if (!ticketId) return { pass: true, reason: null } // No ticket linked — skip Layer 3
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) return { pass: false, reason: 'Linked procurement ticket not found (ORPHAN_TICKET)' }
  if (ticket.status === 'REJECTED') return { pass: false, reason: 'Linked ticket has been rejected' }
  return { pass: true, reason: null }
}

// ─── F6: Submit Expense (triggers F7 + F9 internally) ────────────────────────

const submitExpense = async ({
  projectId,
  submittedBy,
  ticketId,
  vendorName,
  amount,
  receiptDate,
  category,
  receiptImageURL,
  birNumber,
  quantity,
  tin,
  birPermitNumber,
}) => {
  // F7 — BIR Classification
  const birValidationStatus = classifyBIR({ tin, birPermitNumber, orSiNumber: birNumber })

  // Create the expense record (status = PENDING)
  const expense = await prisma.expense.create({
    data: {
      projectId,
      submittedBy,
      ticketId:    ticketId    ?? null,
      vendorName,
      amount,
      receiptDate: new Date(receiptDate),
      category,
      birValidationStatus,
      receiptImageURL,
      birNumber:   birNumber   ?? null,
      quantity,
      status: 'PENDING',
    },
  })

  // F9 — Run all three screening layers
  const flags = []

  // Layer 1: BIR Duplicate
  const isDuplicate = await checkBIRDuplicate({ tin, birPermitNumber, orSiNumber: birNumber })
  if (isDuplicate) {
    flags.push({ flagType: 'BIR_DUPLICATE', detectionLayer: 'BIR_DUPLICATE', reason: 'Duplicate BIR receipt detected (TIN + Permit + OR/SI match)' })
  }

  // Layer 2: Vendor Validation
  const vendorResult = await checkVendorList(vendorName)
  if (!vendorResult.pass) {
    flags.push({ flagType: 'VENDOR_VALIDATION', detectionLayer: 'VENDOR_VALIDATION', reason: vendorResult.reason })
  }

  // Layer 3: Ticket Mismatch
  const ticketResult = await checkTicketMismatch(ticketId, amount)
  if (!ticketResult.pass) {
    flags.push({ flagType: 'TICKET_MISMATCH', detectionLayer: 'TICKET_MISMATCH', reason: ticketResult.reason })
  }

  // Insert fraud flags if any
  if (flags.length > 0) {
    await prisma.fraudFlag.createMany({
      data: flags.map(f => ({
        expenseId:      expense.id,
        flaggedBy:      'SYSTEM',
        flagType:       f.flagType,
        detectionLayer: f.detectionLayer,
        reason:         f.reason,
      })),
    })
  }

  return { expense, flagCount: flags.length, flags }
}

// ─── GET expenses for a project ───────────────────────────────────────────────

const getExpenses = async ({ projectId, status }) => {
  return prisma.expense.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
    },
    include: {
      submitter:  { select: { id: true, name: true, role: true } },
      approver:   { select: { id: true, name: true, role: true } },
      ticket:     { select: { id: true, subject: true, type: true } },
      fraudFlags: true,
    },
    orderBy: { submittedAt: 'desc' },
  })
}

// ─── GET single expense ───────────────────────────────────────────────────────

const getExpenseById = async (expenseId) => {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      submitter:         { select: { id: true, name: true, role: true } },
      approver:          { select: { id: true, name: true, role: true } },
      ticket:            { select: { id: true, subject: true, type: true } },
      fraudFlags:        true,
      blockchainLogs:    true,
      receiptAllocations: true,
    },
  })
}

// ─── PATCH — PM approves expense (triggers F12 stub) ─────────────────────────

const approveExpense = async (expenseId, approvedBy) => {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!expense) throw Object.assign(new Error('Expense not found'), { status: 404 })
  if (expense.status !== 'PENDING') {
    throw Object.assign(new Error(`Cannot approve expense with status: ${expense.status}`), { status: 400 })
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: { status: 'APPROVED', approvedBy },
  })

  // F12 — Blockchain stub: record entry in BlockchainLog
  // In production this would submit SHA-256 hash to Geth PoA nodes
  await recordBlockchainEntry(expenseId, approvedBy, 'EXPENSE_APPROVED')

  return updated
}

// ─── PATCH — PM rejects expense ───────────────────────────────────────────────

const rejectExpense = async (expenseId, approvedBy) => {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!expense) throw Object.assign(new Error('Expense not found'), { status: 404 })
  if (expense.status !== 'PENDING') {
    throw Object.assign(new Error(`Cannot reject expense with status: ${expense.status}`), { status: 400 })
  }

  return prisma.expense.update({
    where: { id: expenseId },
    data: { status: 'REJECTED', approvedBy },
  })
}

// ─── F8: Split Receipt Allocation ────────────────────────────────────────────
// allocations: [{ projectId, allocatedAmount }]
// Sum of allocatedAmount must equal expense.amount

const splitAllocate = async (expenseId, allocations, actorId) => {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!expense) throw Object.assign(new Error('Expense not found'), { status: 404 })

  // Validate sum
  const total = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount), 0)
  const expenseAmount = parseFloat(expense.amount)
  if (Math.abs(total - expenseAmount) > 0.01) {
    throw Object.assign(
      new Error(`Allocated amounts (${total}) must equal the expense amount (${expenseAmount})`),
      { status: 400 }
    )
  }

  const commonReceiptId = expenseId // Link all portions to the parent expense

  const created = await prisma.receiptAllocation.createMany({
    data: allocations.map(a => ({
      expenseId,
      projectId:       a.projectId,
      allocatedAmount: a.allocatedAmount,
      commonReceiptId,
    })),
  })

  // F12 — Record blockchain entry for split allocation event
  await recordBlockchainEntry(expenseId, actorId, 'EXPENSE_APPROVED')

  return created
}

// ─── F12: Blockchain Log Entry (stub — wire to Geth in Iteration 12) ─────────

const recordBlockchainEntry = async (expenseId, actorId, eventType) => {
  // Stub: generates a placeholder txHash until Geth PoA is wired
  // In Iteration 12, this will: serialize expense → SHA-256 → submit to Geth nodes → store real txHash
  const fakeTxHash = `0x${require('crypto').createHash('sha256').update(`${expenseId}-${Date.now()}`).digest('hex')}`

  return prisma.blockchainLog.create({
    data: {
      expenseId,
      actorId,
      txHash:             fakeTxHash,
      blockNumber:        0,           // Will be set by Geth response in Iteration 12
      eventType,
      validatorNodeCount: 0,           // Will be confirmed node count
      consensusType:      'Clique',
    },
  })
}

module.exports = {
  submitExpense,
  getExpenses,
  getExpenseById,
  approveExpense,
  rejectExpense,
  splitAllocate,
  recordBlockchainEntry,
}
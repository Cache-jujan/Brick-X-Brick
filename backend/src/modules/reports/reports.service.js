const prisma = require('../../config/db')
const { recordBlockchainEntry } = require('../expenses/expenses.service')

// F11 — Financial Analytics and Reporting
// Computes: total expenses, net P&L, budget utilization %, cost variance,
// BIR tax-deductible total, renders data for Chart.js on the frontend
// Also logs the report generation event to blockchain via F12

const generateReport = async ({ projectIds, from, to, requestedBy }) => {
  const fromDate = from ? new Date(from) : new Date('2000-01-01')
  const toDate   = to   ? new Date(to)   : new Date()

  // Fetch all approved expenses for the selected projects and period
  const expenses = await prisma.expense.findMany({
    where: {
      projectId: { in: projectIds },
      status: 'APPROVED',
      submittedAt: { gte: fromDate, lte: toDate },
    },
    include: {
      project: { select: { id: true, name: true, budget: true } },
    },
  })

  // Fetch project details for budget reference
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, budget: true, clientName: true },
  })

  // Aggregate per project
  const projectStats = projects.map(project => {
    const projectExpenses = expenses.filter(e => e.projectId === project.id)

    // Step 3a — Total Approved Expenses
    const totalExpenses = projectExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

    // Step 3b — Net P&L (Target Budget − Total Expenses)
    const budget = parseFloat(project.budget)
    const netPL  = budget - totalExpenses
    const isOverBudget = netPL < 0

    // Step 3c — Budget Utilization %
    const budgetUtilization = budget > 0 ? (totalExpenses / budget) * 100 : 0

    // Step 6 — BIR Tax-Deductible Total (FORMAL receipts only)
    const birTaxDeductible = projectExpenses
      .filter(e => e.birValidationStatus === 'FORMAL')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)

    // Chart data: expenses by category
    const byCategory = projectExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
      return acc
    }, {})

    return {
      projectId:        project.id,
      projectName:      project.name,
      clientName:       project.clientName,
      budget,
      totalExpenses,
      netPL,
      isOverBudget,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      birTaxDeductible,
      byCategory,
      expenseCount:     projectExpenses.length,
    }
  })

  // Step 7 — Data freshness timestamp (current server UTC)
  const dataFreshnessTimestamp = new Date().toISOString()

  // Pending/flagged expense counts (integrity warnings)
  const pendingCount = await prisma.expense.count({
    where: { projectId: { in: projectIds }, status: 'PENDING' },
  })
  const flaggedCount = await prisma.fraudFlag.count({
    where: { expense: { projectId: { in: projectIds } }, resolvedAt: null },
  })

  const report = {
    generatedAt: dataFreshnessTimestamp,
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    projects: projectStats,
    summary: {
      totalExpensesAllProjects: projectStats.reduce((s, p) => s + p.totalExpenses, 0),
      totalBudgetAllProjects:   projectStats.reduce((s, p) => s + p.budget, 0),
      birTaxDeductibleTotal:    projectStats.reduce((s, p) => s + p.birTaxDeductible, 0),
      overBudgetProjects:       projectStats.filter(p => p.isOverBudget).map(p => p.projectId),
    },
    integrityWarnings: {
      pendingExpenses: pendingCount,
      unresolvedFlags: flaggedCount,
    },
  }

  // Step 9 & 10 — Log report generation event to blockchain via F12
  // Uses the first expenseId found for the log FK requirement
  // In full F12 implementation this would hash the entire report metadata
  const firstExpense = expenses[0]
  if (firstExpense) {
    try {
      await recordBlockchainEntry(firstExpense.id, requestedBy, 'REPORT_GENERATED')
    } catch (_) {
      // Non-blocking — report still returns even if blockchain is unavailable
      report.blockchainWarning = 'Report generation event could not be logged to blockchain (nodes may be offline)'
    }
  }

  return report
}

module.exports = { generateReport }
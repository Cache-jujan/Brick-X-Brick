import { useState, useEffect } from 'react'
import { FileText, Download, AlertTriangle } from 'lucide-react'
import { Button, Card, Spinner } from '../components/ui/Library'
import { reportsApi, projectsApi } from '../api'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

const COLORS = ['#D97B2C', '#6C63FF', '#3EC87A', '#F5A623', '#E84B4B']

export default function Reports() {
  const [projects,   setProjects]   = useState([])
  const [selected,   setSelected]   = useState([])
  const [report,     setReport]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab,  setActiveTab]  = useState('summary')
  const [from,       setFrom]       = useState('')
  const [to,         setTo]         = useState('')

  useEffect(() => {
    projectsApi.list().then(data => {
      setProjects(data)
      // Default: select all active
      setSelected(data.filter(p => p.status === 'ACTIVE').map(p => p.id))
    }).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (selected.length === 0) return
    setLoading(true)
    try {
      const data = await reportsApi.generate(selected, from || undefined, to || undefined)
      setReport(data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  const toggleProject = (id) =>
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id])

  // Build chart data from report
  const barData = report?.projects.map(p => ({
    name:    p.projectName.split(' ').slice(0, 2).join(' '),
    budget:  p.budget,
    spent:   p.totalExpenses,
    variance: Math.abs(p.netPL),
  })) ?? []

  const categoryData = report ? Object.entries(
    report.projects.reduce((acc, p) => {
      Object.entries(p.byCategory || {}).forEach(([k, v]) => {
        acc[k] = (acc[k] || 0) + v
      })
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value })) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
          Financial Analytics & Reporting
        </h1>
        <select
          className="h-10 rounded-lg border px-3 text-sm"
          style={{ borderColor: '#2E2E2E', backgroundColor: '#1A1A1A', color: '#F0EDE8' }}
        >
          <option>Custom Range</option>
        </select>
      </div>

      {/* Controls */}
      <Card className="space-y-4">
        <h3 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Report Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: '#9A9590' }}>From Date</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: '#2E2E2E', backgroundColor: '#1A1A1A', color: '#F0EDE8' }}
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: '#9A9590' }}>To Date</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: '#2E2E2E', backgroundColor: '#1A1A1A', color: '#F0EDE8' }}
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} isLoading={loading} className="w-full">
              Generate Report
            </Button>
          </div>
        </div>

        {/* Project selector */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: '#9A9590' }}>Select Projects</label>
          <div className="flex flex-wrap gap-2">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => toggleProject(p.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: selected.includes(p.id) ? '#D97B2C' : '#2E2E2E',
                  color: selected.includes(p.id) ? 'white' : '#9A9590',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* No report yet */}
      {!report && !loading && (
        <Card className="text-center py-16">
          <FileText size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#9A9590' }} />
          <p className="text-lg font-medium mb-2" style={{ color: '#F0EDE8' }}>No report generated yet</p>
          <p className="text-sm" style={{ color: '#9A9590' }}>
            Select projects and date range, then click Generate Report.
          </p>
        </Card>
      )}

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {/* Report output */}
      {report && (
        <>
          {/* Integrity warnings */}
          {(report.integrityWarnings.pendingExpenses > 0 || report.integrityWarnings.unresolvedFlags > 0) && (
            <div className="p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
              <AlertTriangle size={18} style={{ color: '#F5A623' }} />
              <p className="text-sm" style={{ color: '#F5A623' }}>
                Integrity warning: {report.integrityWarnings.pendingExpenses} pending expenses and {report.integrityWarnings.unresolvedFlags} unresolved fraud flags excluded from totals.
                Data freshness: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl" style={{ backgroundColor: '#242424', border: '1px solid #2E2E2E' }}>
            {[
              { label: 'Total Budget',       value: `₱${report.summary.totalBudgetAllProjects.toLocaleString()}`,   color: '#F0EDE8' },
              { label: 'Total Expenses',     value: `₱${report.summary.totalExpensesAllProjects.toLocaleString()}`, color: '#D97B2C' },
              { label: 'Net P&L',            value: `₱${(report.summary.totalBudgetAllProjects - report.summary.totalExpensesAllProjects).toLocaleString()}`, color: report.summary.totalExpensesAllProjects <= report.summary.totalBudgetAllProjects ? '#3EC87A' : '#E84B4B' },
              { label: 'BIR Tax-Deductible', value: `₱${report.summary.birTaxDeductibleTotal.toLocaleString()}`,   color: '#6C63FF' },
            ].map(k => (
              <div key={k.label}>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#9A9590' }}>{k.label}</div>
                <div className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2" style={{ borderBottom: '1px solid #2E2E2E' }}>
            {['summary', 'tax', 'variance'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize"
                style={{
                  borderBottomColor: activeTab === tab ? '#D97B2C' : 'transparent',
                  color: activeTab === tab ? '#D97B2C' : '#9A9590',
                }}
              >
                {tab === 'summary' ? 'P&L Summary' : tab === 'tax' ? 'Tax Report' : 'Budget vs Actual'}
              </button>
            ))}
          </div>

          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Expense by Category</h3>
                {categoryData.length === 0 ? (
                  <div className="text-center py-8" style={{ color: '#9A9590' }}>No expense data yet.</div>
                ) : (
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#242424', borderColor: '#2E2E2E' }} formatter={v => `₱${Number(v).toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Per-Project Summary</h3>
                <div className="space-y-3">
                  {report.projects.map(p => (
                    <div key={p.projectId} className="p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm">{p.projectName}</span>
                        <span className="text-sm font-bold" style={{ color: p.isOverBudget ? '#E84B4B' : '#3EC87A' }}>
                          {p.isOverBudget ? '⚠️ Over' : '✅ Under'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs" style={{ color: '#9A9590' }}>
                        <span>Spent: ₱{p.totalExpenses.toLocaleString()}</span>
                        <span>Budget: ₱{p.budget.toLocaleString()}</span>
                        <span>Utilization: {p.budgetUtilization}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'tax' && (
            <Card className="text-center py-12">
              <FileText size={40} className="mx-auto mb-4" style={{ color: '#D97B2C' }} />
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>BIR-Ready Report</h2>
              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#9A9590' }}>
                Tax-deductible expenses (FORMAL receipts only) compiled for BIR audit compliance.
              </p>
              <div className="grid grid-cols-2 gap-8 mb-8 max-w-md mx-auto">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                  <div className="text-2xl font-bold" style={{ color: '#3EC87A' }}>
                    ₱{report.summary.birTaxDeductibleTotal.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: '#9A9590' }}>Formal (Tax-Deductible)</div>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                  <div className="text-2xl font-bold" style={{ color: '#F5A623' }}>
                    ₱{(report.summary.totalExpensesAllProjects - report.summary.birTaxDeductibleTotal).toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: '#9A9590' }}>Informal Receipts</div>
                </div>
              </div>
              <Button size="lg" className="gap-2" isLoading={generating} onClick={() => setGenerating(true)}>
                <Download size={16} /> Download BIR Report Package
              </Button>
            </Card>
          )}

          {activeTab === 'variance' && (
            <Card>
              <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Budget vs Actual per Project</h3>
              {barData.length === 0 ? (
                <div className="text-center py-8" style={{ color: '#9A9590' }}>No data to display.</div>
              ) : (
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#9A9590', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#242424', borderColor: '#2E2E2E', color: '#F0EDE8' }}
                        formatter={v => `₱${Number(v).toLocaleString()}`}
                      />
                      <Bar dataKey="budget" name="Budget" fill="#2E2E2E" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="spent"  name="Spent"  fill="#D97B2C" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
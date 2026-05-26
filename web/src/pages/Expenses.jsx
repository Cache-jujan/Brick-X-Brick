import { useState, useEffect } from 'react'
import { Search, FileText, AlertTriangle, Check, X, Filter } from 'lucide-react'
import { Button, Card, Badge, Input, Modal, Spinner } from '../components/ui/Library'
import { expensesApi, projectsApi } from '../api'

const statusVariant = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }
const birVariant    = { FORMAL: 'success', INFORMAL: 'warning' }

export default function Expenses() {
  const [expenses,   setExpenses]   = useState([])
  const [projects,   setProjects]   = useState([])
  const [projectId,  setProjectId]  = useState('')
  const [statusFilter, setStatus]   = useState('PENDING')
  const [loading,    setLoading]    = useState(false)
  const [acting,     setActing]     = useState({})
  const [confirmExp, setConfirmExp] = useState(null)
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(() => {})
  }, [])

  useEffect(() => {
    if (!projectId) { setExpenses([]); return }
    setLoading(true)
    expensesApi.list({ projectId, status: statusFilter || undefined })
      .then(setExpenses)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, statusFilter])

  const handleApprove = async (expense) => {
    if (expense.fraudFlags?.length > 0) { setConfirmExp(expense); return }
    await doApprove(expense.id)
  }

  const doApprove = async (id) => {
    setActing(a => ({ ...a, [id]: 'approving' }))
    try {
      const updated = await expensesApi.approve(id)
      setExpenses(es => es.map(e => e.id === id ? { ...e, status: 'APPROVED' } : e))
    } catch (_) {}
    finally { setActing(a => ({ ...a, [id]: null })); setConfirmExp(null) }
  }

  const handleReject = async (id) => {
    setActing(a => ({ ...a, [id]: 'rejecting' }))
    try {
      await expensesApi.reject(id)
      setExpenses(es => es.map(e => e.id === id ? { ...e, status: 'REJECTED' } : e))
    } catch (_) {}
    finally { setActing(a => ({ ...a, [id]: null })) }
  }

  const filtered = expenses.filter(e =>
    !search || e.vendorName.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = expenses.filter(e => e.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Expense Approvals</h1>
          <p className="text-sm" style={{ color: '#9A9590' }}>Review and approve submitted expenses</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" className="px-3 py-1 text-sm font-bold">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg" style={{ backgroundColor: '#242424', border: '1px solid #2E2E2E' }}>
        <select
          className="flex h-10 rounded-lg border px-3 py-2 text-sm flex-1"
          style={{ borderColor: '#2E2E2E', backgroundColor: '#1A1A1A', color: '#F0EDE8' }}
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          <option value="">Select a project...</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: statusFilter === s ? '#D97B2C' : 'transparent',
                color: statusFilter === s ? 'white' : '#9A9590',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9A9590' }} />
          <Input
            placeholder="Search vendor..."
            className="pl-9 w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Empty state — no project selected */}
      {!projectId && (
        <div className="text-center py-16" style={{ color: '#9A9590' }}>
          <Filter size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">Select a project</p>
          <p className="text-sm">Choose a project above to view its expense submissions.</p>
        </div>
      )}

      {/* Loading */}
      {projectId && loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {/* Expense list */}
      {projectId && !loading && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#9A9590' }}>
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p>No expenses found for this filter.</p>
            </div>
          ) : (
            filtered.map(expense => (
              <div
                key={expense.id}
                className="flex flex-col md:flex-row gap-4 p-4 rounded-xl"
                style={{
                  backgroundColor: expense.fraudFlags?.length > 0 ? 'rgba(232,75,75,0.05)' : '#242424',
                  border: `1px solid ${expense.fraudFlags?.length > 0 ? 'rgba(232,75,75,0.3)' : '#2E2E2E'}`,
                }}
              >
                {/* Receipt icon */}
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}
                >
                  <FileText size={24} style={{ color: '#9A9590' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{expense.submitter?.name ?? '—'}</span>
                        <Badge variant="default" className="text-[10px]">{expense.submitter?.role}</Badge>
                        <Badge variant={birVariant[expense.birValidationStatus] || 'default'} className="text-[10px]">
                          {expense.birValidationStatus === 'FORMAL' ? '✅ BIR Compliant' : '⚠️ Informal'}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg">{expense.vendorName}</h3>
                      <div className="flex flex-wrap gap-3 text-sm mt-1" style={{ color: '#9A9590' }}>
                        <span className="px-2 py-0.5 rounded" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                          {expense.category}
                        </span>
                        <span>{new Date(expense.receiptDate).toLocaleDateString()}</span>
                        {expense.ticket && (
                          <span style={{ color: '#6C63FF' }}>Ticket: {expense.ticket.subject}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#D97B2C' }}>
                        ₱{Number(expense.amount).toLocaleString()}
                      </div>
                      <Badge variant={statusVariant[expense.status] || 'default'} className="mt-1">
                        {expense.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Fraud flags */}
                  {expense.fraudFlags?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold px-2 py-1 rounded inline-flex mb-2" style={{ color: '#E84B4B', backgroundColor: 'rgba(232,75,75,0.1)' }}>
                      <AlertTriangle size={12} />
                      {expense.fraudFlags.map(f => f.reason).join(' · ')}
                    </div>
                  )}

                  {/* Actions */}
                  {expense.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-3 mt-3">
                      <Button size="sm" variant="ghost">View Receipt</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E84B4B] text-[#E84B4B] hover:bg-[#E84B4B] hover:text-white"
                        isLoading={acting[expense.id] === 'rejecting'}
                        onClick={() => handleReject(expense.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        isLoading={acting[expense.id] === 'approving'}
                        onClick={() => handleApprove(expense)}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirm flagged expense modal */}
      <Modal
        isOpen={!!confirmExp}
        onClose={() => setConfirmExp(null)}
        title="⚠️ Approve Flagged Expense?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmExp(null)}>Cancel</Button>
            <Button variant="warning" onClick={() => doApprove(confirmExp.id)} isLoading={acting[confirmExp?.id] === 'approving'}>
              Confirm Approval
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(245,166,35,0.2)' }}>
            <AlertTriangle size={32} style={{ color: '#F5A623' }} />
          </div>
          <p className="text-lg font-medium mb-2">This expense has fraud flags.</p>
          <p className="text-sm" style={{ color: '#9A9590' }}>
            Approving this will permanently record the approval on the blockchain audit trail.
          </p>
          {confirmExp?.fraudFlags?.map(f => (
            <div key={f.id} className="mt-3 p-2 rounded text-xs text-left" style={{ backgroundColor: '#1A1A1A', color: '#E84B4B' }}>
              {f.flagType}: {f.reason}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
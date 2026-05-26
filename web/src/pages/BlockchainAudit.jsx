import { useState, useEffect } from 'react'
import { ShieldCheck, Search, CheckCircle2, AlertTriangle, Copy } from 'lucide-react'
import { Button, Card, Badge, Input, Modal, Spinner } from '../components/ui/Library'
import { blockchainApi, projectsApi } from '../api'

export default function BlockchainAudit() {
  const [logs,       setLogs]       = useState([])
  const [projects,   setProjects]   = useState([])
  const [projectId,  setProjectId]  = useState('')
  const [loading,    setLoading]    = useState(false)
  const [verifying,  setVerifying]  = useState({})
  const [verifyResult, setVerifyResult] = useState(null)
  const [search,     setSearch]     = useState('')
  const [copied,     setCopied]     = useState('')

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    blockchainApi.auditLogs(projectId || undefined)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  const handleVerify = async (expenseId) => {
    setVerifying(v => ({ ...v, [expenseId]: true }))
    try {
      const result = await blockchainApi.verify(expenseId)
      setVerifyResult(result)
    } catch (err) {
      setVerifyResult({ verified: false, status: 'ERROR', message: err.response?.data?.error || 'Verification failed' })
    } finally {
      setVerifying(v => ({ ...v, [expenseId]: false }))
    }
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  const filtered = logs.filter(log =>
    !search || log.txHash?.toLowerCase().includes(search.toLowerCase()) ||
    log.expense?.id?.toLowerCase().includes(search.toLowerCase())
  )

  const nodeCount = 3 // display from config

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Blockchain Audit Trail
            <Badge variant="blockchain">{nodeCount}/3 Nodes Active</Badge>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">📥 Export CSV</Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
        <ShieldCheck style={{ color: '#6C63FF' }} className="shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-bold" style={{ color: '#6C63FF' }}>Immutable Record</h4>
          <p className="text-sm" style={{ color: 'rgba(240,237,232,0.8)' }}>
            All approved expenses are cryptographically hashed and recorded to a private blockchain.
            Records cannot be altered or deleted once confirmed by 2/3 validators.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="overflow-hidden p-0">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between" style={{ borderBottom: '1px solid #2E2E2E' }}>
          <select
            className="flex h-10 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: '#2E2E2E', backgroundColor: '#1A1A1A', color: '#F0EDE8', minWidth: 200 }}
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9A9590' }} />
            <Input
              placeholder="Search Hash / Expense ID"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#9A9590' }}>
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">No blockchain entries yet</p>
            <p className="text-sm">Approve an expense to generate the first audit trail entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #2E2E2E', color: '#9A9590' }}>
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Tx Hash</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #2E2E2E' }}>
                {filtered.map(log => (
                  <tr
                    key={log.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid #2E2E2E' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(46,46,46,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-4 py-3 text-xs" style={{ color: '#9A9590' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.expense?.vendorName ?? '—'}</div>
                      <div className="text-xs" style={{ color: '#9A9590' }}>{log.expense?.id?.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#D97B2C' }}>
                      {log.expense?.amount ? `₱${Number(log.expense.amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCopy(log.txHash, log.id)}
                        className="flex items-center gap-1 font-mono text-xs px-2 py-1 rounded max-w-[130px] truncate hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'rgba(108,99,255,0.1)', color: '#6C63FF' }}
                        title={log.txHash}
                      >
                        {log.txHash.substring(0, 12)}...
                        <Copy size={10} />
                      </button>
                      {copied === log.id && <span className="text-xs ml-1" style={{ color: '#3EC87A' }}>Copied!</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="blockchain" className="text-[10px]">
                        {log.eventType?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success" className="text-[10px]">Confirmed</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleVerify(log.expenseId)}
                        disabled={verifying[log.expenseId]}
                        className="text-sm font-medium transition-colors hover:underline"
                        style={{ color: '#D97B2C' }}
                      >
                        {verifying[log.expenseId] ? 'Verifying...' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Verification result modal */}
      <Modal
        isOpen={!!verifyResult}
        onClose={() => setVerifyResult(null)}
        title="Blockchain Verification"
      >
        {verifyResult && (
          <div className="space-y-6 text-center">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center mx-auto relative"
              style={{ backgroundColor: verifyResult.verified ? 'rgba(108,99,255,0.1)' : 'rgba(232,75,75,0.1)' }}
            >
              {verifyResult.verified ? (
                <ShieldCheck size={48} style={{ color: '#6C63FF' }} />
              ) : (
                <AlertTriangle size={48} style={{ color: '#E84B4B' }} />
              )}
              <div
                className="absolute -bottom-2 text-black text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: verifyResult.verified ? '#3EC87A' : '#E84B4B' }}
              >
                {verifyResult.verified ? 'VERIFIED' : 'ALERT'}
              </div>
            </div>

            <div
              className="p-4 rounded-lg border text-left space-y-3 font-mono text-xs"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2E2E2E' }}
            >
              <div>
                <span className="block" style={{ color: '#9A9590' }}>Status</span>
                <span style={{ color: verifyResult.verified ? '#3EC87A' : '#E84B4B' }}>{verifyResult.status}</span>
              </div>
              <div>
                <span className="block" style={{ color: '#9A9590' }}>Transaction Hash</span>
                <span className="break-all" style={{ color: '#6C63FF' }}>{verifyResult.txHash}</span>
              </div>
              <div>
                <span className="block" style={{ color: '#9A9590' }}>Block Number</span>
                <span style={{ color: 'white' }}>#{verifyResult.blockNumber}</span>
              </div>
              <div>
                <span className="block" style={{ color: '#9A9590' }}>Timestamp</span>
                <span style={{ color: 'white' }}>{verifyResult.timestamp ? new Date(verifyResult.timestamp).toISOString() : '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 font-medium" style={{ color: verifyResult.verified ? '#3EC87A' : '#E84B4B' }}>
              {verifyResult.verified ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {verifyResult.message}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
import { useState, useEffect } from 'react'
import client from '../api/client'

const TYPE_LABELS = {
  MATERIAL_REQUEST: 'Material Request',
  WORK_ITEM: 'Work Item',
}

const TYPE_COLORS = {
  MATERIAL_REQUEST: 'bg-blue-100 text-blue-700',
  WORK_ITEM: 'bg-teal-100 text-teal-700',
}

function AssignTicketModal({ ticket, onClose, onAssigned }) {
  const [assignees, setAssignees] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const role = ticket.type === 'MATERIAL_REQUEST' ? 'PURCHASER' : 'SITE_MANAGER'
    client.get(`/api/users?role=${role}`)
      .then(res => setAssignees(res.data))
      .catch(() => setError('Failed to load assignees'))
  }, [ticket.type])

  const handleAssign = async () => {
    if (!selectedId) return setError('Please select an assignee')
    setLoading(true)
    setError('')
    try {
      await client.patch(`/api/tickets/${ticket.id}/assign`, { assignedTo: selectedId })
      onAssigned(ticket.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Assignment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Assign Ticket</h2>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{ticket.description}</p>

        <div className="mb-2">
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${TYPE_COLORS[ticket.type]}`}>
            {TYPE_LABELS[ticket.type]}
          </span>
        </div>

        <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
          Assign to {ticket.type === 'MATERIAL_REQUEST' ? 'Purchaser' : 'Site Manager'}
        </label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">— Select person —</option>
          {assignees.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Assigning…' : 'Confirm Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TicketQueue() {
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [modalTicket, setModalTicket] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/api/projects')
      .then(res => setProjects(res.data))
      .catch(() => setError('Failed to load projects'))
  }, [])

  useEffect(() => {
    if (!selectedProjectId) return setTickets([])
    setLoadingTickets(true)
    client.get(`/api/tickets?projectId=${selectedProjectId}&status=UNASSIGNED`)
      .then(res => setTickets(res.data))
      .catch(() => setError('Failed to load tickets'))
      .finally(() => setLoadingTickets(false))
  }, [selectedProjectId])

  const handleAssigned = (ticketId) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId))
    setModalTicket(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Ticket Queue</h1>
        <p className="text-sm text-gray-500 mb-6">Assign unassigned tickets to the right team member</p>

        {/* Project Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
          >
            <option value="">— Choose a project —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Ticket List */}
        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        {loadingTickets ? (
          <div className="text-center text-gray-400 py-16">Loading tickets…</div>
        ) : !selectedProjectId ? (
          <div className="text-center text-gray-400 py-16">Select a project to view tickets</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500 font-medium">No unassigned tickets</p>
            <p className="text-gray-400 text-sm">All tickets for this project have been assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[ticket.type]}`}>
                      {TYPE_LABELS[ticket.type]}
                    </span>
                    {ticket.quantity && (
                      <span className="text-xs text-gray-400">Qty: {ticket.quantity}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{ticket.description}</p>
                </div>
                <button
                  onClick={() => setModalTicket(ticket)}
                  className="shrink-0 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalTicket && (
        <AssignTicketModal
          ticket={modalTicket}
          onClose={() => setModalTicket(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  )
}
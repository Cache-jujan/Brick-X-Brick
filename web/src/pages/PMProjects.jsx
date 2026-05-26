import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Briefcase, Calendar, CheckCircle2, AlertTriangle,
  Plus, Target, ArrowLeft, Ticket, ChevronRight,
  RefreshCw, X
} from 'lucide-react'
import { Button, Card, Badge, Input, Modal, Textarea, Select, Spinner } from '../components/ui/Library'
import { projectsApi, milestonesApi, tasksApi, ticketsApi, usersApi } from '../api'

// ─── helpers ─────────────────────────────────────────────────────────────────

const statusVariant = {
  ACTIVE: 'success', DRAFT: 'default', COMPLETED: 'blockchain', ARCHIVED: 'default',
}
const milestoneVariant = {
  ON_TRACK: 'success', AT_RISK: 'warning', OVERDUE: 'danger', COMPLETED: 'blockchain',
}
const ticketVariant = {
  PENDING: 'warning', RESOLVED: 'success', REJECTED: 'danger',
}

function ProgressBar({ pct, color = '#D97B2C' }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: '#2E2E2E' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', backgroundColor: color, transition: 'width 0.3s' }} />
    </div>
  )
}

// ─── Create Milestone Modal ───────────────────────────────────────────────────

function CreateMilestoneModal({ projectId, onCreated, onClose }) {
  const [name, setName]           = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !targetDate) { setError('Name and target date are required'); return }
    setLoading(true)
    try {
      const m = await milestonesApi.create({ projectId, name: name.trim(), targetDate })
      onCreated(m)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create milestone')
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Milestone"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={loading}>Create Milestone</Button>
      </>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Milestone Name *</label>
          <Input placeholder="e.g. Foundation Work" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Target Date *</label>
          <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
        </div>
        {error && <p className="text-sm" style={{ color: '#E84B4B' }}>{error}</p>}
      </form>
    </Modal>
  )
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateTaskModal({ projectId, milestoneId, onCreated, onClose }) {
  const [name, setName]         = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [siteManagers, setSMs]  = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    usersApi.list('SITE_MANAGER').then(setSMs).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !assignedTo || !dueDate) { setError('Name, due date, and assignee are required'); return }
    setLoading(true)
    try {
      const t = await tasksApi.create({ milestoneId, projectId, name: name.trim(), assignedTo, dueDate })
      onCreated(t)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task')
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title="Add Task"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={loading}>Add Task</Button>
      </>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Task Name *</label>
          <Input placeholder="e.g. Site excavation" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Assign to Site Manager *</label>
          <Select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Select Site Manager</option>
            {siteManagers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Due Date *</label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        {error && <p className="text-sm" style={{ color: '#E84B4B' }}>{error}</p>}
      </form>
    </Modal>
  )
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

function CreateTicketModal({ projectId, onCreated, onClose }) {
  const [type, setType]           = useState('MATERIAL_REQUEST')
  const [subject, setSubject]     = useState('')
  const [description, setDesc]    = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [quantity, setQuantity]   = useState('')
  const [assignees, setAssignees] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    const role = type === 'MATERIAL_REQUEST' ? 'PURCHASER' : 'SITE_MANAGER'
    usersApi.list(role).then(setAssignees).catch(() => {})
    setAssignedTo('')
  }, [type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !assignedTo) { setError('Subject and assignee are required'); return }
    setLoading(true)
    try {
      const t = await ticketsApi.create({
        projectId, type, subject: subject.trim(),
        description: description.trim() || null,
        assignedTo,
        quantity: quantity ? parseInt(quantity) : null,
      })
      onCreated(t)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket')
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Ticket"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={loading}>Create Ticket</Button>
      </>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Ticket Type *</label>
          <Select value={type} onChange={e => setType(e.target.value)}>
            <option value="MATERIAL_REQUEST">Material Request → Purchaser</option>
            <option value="WORK_ITEM">Work Item → Site Manager</option>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Subject *</label>
          <Input placeholder="Brief ticket subject" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">
            Assign to {type === 'MATERIAL_REQUEST' ? 'Purchaser' : 'Site Manager'} *
          </label>
          <Select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Select assignee</option>
            {assignees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Description</label>
          <Textarea rows={3} placeholder="Detailed description..." value={description} onChange={e => setDesc(e.target.value)} />
        </div>
        {type === 'MATERIAL_REQUEST' && (
          <div>
            <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Quantity</label>
            <Input type="number" placeholder="e.g. 50" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
        )}
        {error && <p className="text-sm" style={{ color: '#E84B4B' }}>{error}</p>}
      </form>
    </Modal>
  )
}

// ─── Project Detail View ──────────────────────────────────────────────────────

function ProjectDetail({ project, onBack }) {
  const [milestones,  setMilestones]  = useState([])
  const [tickets,     setTickets]     = useState([])
  const [selectedM,   setSelectedM]   = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [showNewM,    setShowNewM]    = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [resolving,   setResolving]   = useState({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ms, ts] = await Promise.all([
        milestonesApi.list(project.id),
        ticketsApi.list({ projectId: project.id }),
      ])
      setMilestones(ms)
      setTickets(ts)
      if (ms.length > 0 && !selectedM) setSelectedM(ms[0])
    } catch (_) {}
    finally { setLoading(false) }
  }, [project.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleTicketAction = async (ticketId, action) => {
    setResolving(r => ({ ...r, [ticketId]: true }))
    try {
      const updated = action === 'resolve'
        ? await ticketsApi.resolve(ticketId)
        : await ticketsApi.reject(ticketId)
      setTickets(ts => ts.map(t => t.id === ticketId ? updated : t))
    } catch (_) {}
    finally { setResolving(r => ({ ...r, [ticketId]: false })) }
  }

  const pendingTickets  = tickets.filter(t => t.status === 'PENDING')
  const resolvedTickets = tickets.filter(t => t.status !== 'PENDING')
  const selectedMTasks  = selectedM?.tasks ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg transition-colors hover:text-white" style={{ color: '#9A9590' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{project.name}</h1>
          <p className="text-sm" style={{ color: '#9A9590' }}>{project.clientName}</p>
        </div>
        <Badge variant={statusVariant[project.status] || 'default'}>{project.status}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completion',  value: `${project.completionPct}%`,            color: '#D97B2C' },
          { label: 'Milestones', value: milestones.length,                        color: '#F0EDE8' },
          { label: 'Open Tickets', value: pendingTickets.length,                  color: '#F5B93E' },
          { label: 'Budget',      value: `₱${Number(project.budget).toLocaleString()}`, color: '#F0EDE8' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs mb-1" style={{ color: '#9A9590' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Milestones & Tasks ── */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Milestones & Tasks</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={fetchAll}><RefreshCw size={14} /></Button>
                <Button size="sm" onClick={() => setShowNewM(true)}><Plus size={14} /> Milestone</Button>
              </div>
            </div>

            {milestones.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#9A9590' }}>
                <Target size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No milestones yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {milestones.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedM(m)}
                    className="rounded-lg p-3 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: selectedM?.id === m.id ? 'rgba(217,123,44,0.1)' : '#1A1A1A',
                      border: `1px solid ${selectedM?.id === m.id ? 'rgba(217,123,44,0.3)' : '#2E2E2E'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={milestoneVariant[m.status] || 'default'} className="text-[10px]">
                          {m.status?.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-bold" style={{ color: '#D97B2C' }}>{m.completionPct}%</span>
                      </div>
                    </div>
                    <ProgressBar pct={m.completionPct} />
                    <p className="text-xs mt-1" style={{ color: '#9A9590' }}>
                      {m.tasks?.length ?? 0} tasks · Due {new Date(m.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Selected milestone tasks */}
            {selectedM && (
              <div className="pt-2" style={{ borderTop: '1px solid #2E2E2E' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: '#9A9590' }}>
                    Tasks in: <span style={{ color: '#F0EDE8' }}>{selectedM.name}</span>
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setShowNewTask(true)}>
                    <Plus size={12} /> Task
                  </Button>
                </div>
                {selectedMTasks.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: '#9A9590' }}>No tasks yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMTasks.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#242424' }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            size={16}
                            style={{ color: t.completionPct === 100 ? '#3EC87A' : '#9A9590' }}
                          />
                          <span className="text-sm">{t.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: '#9A9590' }}>
                            {t.assignee?.name ?? '—'}
                          </span>
                          <span className="text-sm font-bold" style={{ color: '#D97B2C' }}>{t.completionPct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* ── Tickets ── */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Tickets</h2>
              <Button size="sm" onClick={() => setShowNewTicket(true)}><Plus size={14} /> Ticket</Button>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#9A9590' }}>
                <Ticket size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...pendingTickets, ...resolvedTickets].map(t => (
                  <div key={t.id} className="rounded-lg p-3" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <Badge
                            variant={t.type === 'MATERIAL_REQUEST' ? 'blockchain' : 'default'}
                            className="text-[10px]"
                          >
                            {t.type === 'MATERIAL_REQUEST' ? 'Material' : 'Work Item'}
                          </Badge>
                          <Badge variant={ticketVariant[t.status] || 'default'} className="text-[10px]">
                            {t.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{t.subject}</p>
                        <p className="text-xs" style={{ color: '#9A9590' }}>→ {t.assignee?.name ?? '—'}</p>
                      </div>
                      {t.status === 'PENDING' && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleTicketAction(t.id, 'resolve')}
                            disabled={resolving[t.id]}
                            className="p-1.5 rounded text-xs transition-colors"
                            style={{ backgroundColor: 'rgba(62,200,122,0.1)', color: '#3EC87A' }}
                            title="Resolve"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => handleTicketAction(t.id, 'reject')}
                            disabled={resolving[t.id]}
                            className="p-1.5 rounded text-xs transition-colors"
                            style={{ backgroundColor: 'rgba(232,75,75,0.1)', color: '#E84B4B' }}
                            title="Reject"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modals */}
      {showNewM && (
        <CreateMilestoneModal
          projectId={project.id}
          onCreated={m => { setMilestones(ms => [...ms, { ...m, tasks: [] }]); setSelectedM({ ...m, tasks: [] }) }}
          onClose={() => setShowNewM(false)}
        />
      )}
      {showNewTask && selectedM && (
        <CreateTaskModal
          projectId={project.id}
          milestoneId={selectedM.id}
          onCreated={t => {
            const updated = { ...selectedM, tasks: [...(selectedM.tasks ?? []), t] }
            setSelectedM(updated)
            setMilestones(ms => ms.map(m => m.id === selectedM.id ? updated : m))
          }}
          onClose={() => setShowNewTask(false)}
        />
      )}
      {showNewTicket && (
        <CreateTicketModal
          projectId={project.id}
          onCreated={t => setTickets(ts => [t, ...ts])}
          onClose={() => setShowNewTicket(false)}
        />
      )}
    </div>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-all hover:shadow-lg"
      style={{ borderColor: '#2E2E2E' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(217,123,44,0.5)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#2E2E2E'}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(217,123,44,0.1)' }}>
            <Briefcase size={20} style={{ color: '#D97B2C' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{project.name}</h3>
            <p className="text-xs" style={{ color: '#9A9590' }}>{project.clientName}</p>
          </div>
        </div>
        <Badge variant={statusVariant[project.status] || 'default'}>{project.status}</Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: '#9A9590' }}>Overall Completion</span>
            <span className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#D97B2C' }}>
              {project.completionPct}%
            </span>
          </div>
          <ProgressBar pct={project.completionPct} />
        </div>

        <div className="flex items-center justify-between text-xs" style={{ color: '#9A9590' }}>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No end date'}</span>
          </div>
          <span className="font-medium" style={{ color: '#D97B2C' }}>
            ₱{Number(project.budget).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #2E2E2E' }}>
          <span className="text-xs" style={{ color: '#9A9590' }}>Click to manage</span>
          <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#D97B2C' }}>
            View Details <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PMProjects() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [projects,   setProjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [selected,   setSelected]   = useState(null)

  useEffect(() => {
    projectsApi.list()
      .then(data => {
        setProjects(data)
        // If URL has an id, open that project
        if (id) {
          const found = data.find(p => p.id === id)
          if (found) setSelected(found)
        }
      })
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSelect = (project) => {
    setSelected(project)
    navigate(`/pm/projects/${project.id}`)
  }

  const handleBack = () => {
    setSelected(null)
    navigate('/pm/projects')
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>

  if (selected) return <ProjectDetail project={selected} onBack={handleBack} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Project Manager Dashboard
        </h1>
        <p className="text-sm" style={{ color: '#9A9590' }}>
          Milestone planning, task management, and ticket oversight
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(232,75,75,0.1)', color: '#E84B4B' }}>
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#9A9590' }}>
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">No projects assigned</p>
          <p className="text-sm">Wait for the General Manager to initialize and assign a project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => handleSelect(p)} />
          ))}
        </div>
      )}
    </div>
  )
}
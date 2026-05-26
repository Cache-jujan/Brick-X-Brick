import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, AlertCircle, CheckCircle2, ChevronRight,
  ShieldCheck, Briefcase, AlertTriangle, FolderPlus,
  FileText, Plus
} from 'lucide-react'
import { Button, Card, Badge, Input, Modal, Select, Textarea, Spinner } from '../components/ui/Library'
import { projectsApi, usersApi } from '../api'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts'

// ─── Create Project + BOM Modal ───────────────────────────────────────────────

function CreateProjectModal({ onCreated, onClose }) {
  const [step, setStep] = useState(1) // 1 = project details, 2 = BOM
  const [form, setForm] = useState({
    name: '', clientName: '', description: '', budget: '', startDate: '', endDate: ''
  })
  const [bomItems, setBomItems] = useState([{ id: 1, description: '', quantity: '' }])
  const [pms, setPMs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    usersApi.list('PROJECT_MANAGER').then(setPMs).catch(() => {})
  }, [])

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addBOMItem = () =>
    setBomItems(items => [...items, { id: Date.now(), description: '', quantity: '' }])

  const removeBOMItem = (id) =>
    setBomItems(items => items.filter(i => i.id !== id))

  const updateBOMItem = (id, k, v) =>
    setBomItems(items => items.map(i => i.id === id ? { ...i, [k]: v } : i))

  const handleCreate = async () => {
    if (!form.name || !form.clientName || !form.budget || !form.startDate) {
      setError('Name, client, budget and start date are required'); return
    }
    setLoading(true)
    setError('')
    try {
      const validItems = bomItems.filter(i => i.description.trim())
      const project = await projectsApi.create({
        name:        form.name.trim(),
        clientName:  form.clientName.trim(),
        description: form.description.trim() || null,
        budget:      parseFloat(form.budget),
        startDate:   form.startDate,
        endDate:     form.endDate || null,
        items:       validItems.map(i => ({
          type:        'MATERIAL_REQUEST',
          description: i.description.trim(),
          quantity:    i.quantity ? parseInt(i.quantity) : null,
        }))
      })
      onCreated(project)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally { setLoading(false) }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={step === 1 ? 'Initialize New Project' : 'Create Bill of Materials (BOM)'}
      footer={
        step === 1 ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => {
              if (!form.name || !form.clientName || !form.budget || !form.startDate) {
                setError('Name, client, budget and start date are required'); return
              }
              setError('')
              setStep(2)
            }}>
              <FileText size={16} /> Next: Create BOM
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleCreate} isLoading={loading}>
              <CheckCircle2 size={16} /> Create Project & BOM
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Project Name *</label>
              <Input placeholder="e.g. Makati Tower" value={form.name} onChange={e => updateForm('name', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Client Name *</label>
              <Input placeholder="e.g. ABC Corp" value={form.clientName} onChange={e => updateForm('clientName', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Description</label>
            <Textarea rows={2} placeholder="Brief project description..." value={form.description} onChange={e => updateForm('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Budget (PHP) *</label>
              <Input type="number" placeholder="2500000" value={form.budget} onChange={e => updateForm('budget', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[#F0EDE8] block mb-1">Start Date *</label>
              <Input type="date" value={form.startDate} onChange={e => updateForm('startDate', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[#F0EDE8] block mb-1">End Date</label>
              <Input type="date" value={form.endDate} onChange={e => updateForm('endDate', e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: '#E84B4B' }}>{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: '#9A9590' }}>Each item auto-generates a Material Request Ticket.</p>
          {bomItems.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}>
              <span className="col-span-1 flex items-center text-xs font-mono" style={{ color: '#9A9590' }}>#{idx + 1}</span>
              <div className="col-span-7">
                <Input placeholder="Material/Item Name" value={item.description} onChange={e => updateBOMItem(item.id, 'description', e.target.value)} />
              </div>
              <div className="col-span-3">
                <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateBOMItem(item.id, 'quantity', e.target.value)} />
              </div>
              <div className="col-span-1 flex items-center justify-center">
                {bomItems.length > 1 && (
                  <button onClick={() => removeBOMItem(item.id)} className="text-lg leading-none" style={{ color: '#E84B4B' }}>×</button>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addBOMItem} className="w-full gap-2">
            <Plus size={14} /> Add BOM Item
          </Button>
          {error && <p className="text-sm" style={{ color: '#E84B4B' }}>{error}</p>}
        </div>
      )}
    </Modal>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [projects,    setProjects]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Derived KPIs
  const totalBudget  = projects.reduce((s, p) => s + parseFloat(p.budget || 0), 0)
  const activeCount  = projects.filter(p => p.status === 'ACTIVE').length
  const avgCompletion = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.completionPct, 0) / projects.length)
    : 0

  const chartData = projects.map(p => ({
    name:   p.name.split(' ').slice(0, 2).join(' '),
    budget: parseFloat(p.budget),
    spent:  parseFloat(p.budget) * (p.completionPct / 100), // approximation until Expenses module
  }))

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            General Manager Dashboard
          </h1>
          <p className="text-sm" style={{ color: '#9A9590' }}>
            Project oversight, financial analytics, and blockchain verification
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <FolderPlus size={18} /> Create New Project
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium" style={{ color: '#9A9590' }}>Total Active Budget</span>
            <div className="p-1.5 rounded-full" style={{ backgroundColor: 'rgba(62,200,122,0.1)' }}>
              <TrendingUp size={16} style={{ color: '#3EC87A' }} />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#D97B2C' }}>
            ₱{totalBudget.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: '#9A9590' }}>
            Across {activeCount} active project{activeCount !== 1 ? 's' : ''}
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium" style={{ color: '#9A9590' }}>Avg Completion</span>
            <div className="p-1.5 rounded-full" style={{ backgroundColor: 'rgba(217,123,44,0.1)' }}>
              <Briefcase size={16} style={{ color: '#D97B2C' }} />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            {avgCompletion}%
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#2E2E2E' }}>
            <div className="h-full" style={{ width: `${avgCompletion}%`, backgroundColor: '#D97B2C' }} />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium" style={{ color: '#9A9590' }}>Pending Approvals</span>
            <div className="p-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,166,35,0.1)' }}>
              <AlertCircle size={16} style={{ color: '#F5A623' }} />
            </div>
          </div>
          <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#F5B93E' }}>
            —
          </div>
          <Link to="/expenses" className="text-xs font-bold flex items-center gap-1" style={{ color: '#D97B2C' }}>
            Review Expenses <ChevronRight size={12} />
          </Link>
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium" style={{ color: '#9A9590' }}>Blockchain Audit</span>
            <div className="p-1.5 rounded-full" style={{ backgroundColor: 'rgba(108,99,255,0.1)' }}>
              <ShieldCheck size={16} style={{ color: '#6C63FF' }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={20} style={{ color: '#3EC87A' }} />
            <span className="text-xl font-bold" style={{ color: '#3EC87A' }}>Active</span>
          </div>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: '#3EC87A' }} />
            ))}
          </div>
        </Card>
      </div>

      {/* Chart + Project List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Budget vs Estimated Spent</h3>
          </div>
          {chartData.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#9A9590' }}>
              No projects yet. Create one to see analytics.
            </div>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" barGap={4} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#9A9590', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#2E2E2E' }}
                    contentStyle={{ backgroundColor: '#242424', borderColor: '#2E2E2E', color: '#F0EDE8' }}
                    formatter={v => `₱${Number(v).toLocaleString()}`}
                  />
                  <Bar dataKey="budget" name="Budget" fill="#2E2E2E" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="spent" name="Est. Spent" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#D97B2C" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Active Projects</h3>
            <Link to="/projects" className="text-sm" style={{ color: '#D97B2C' }}>View All</Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#9A9590' }}>
              <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ backgroundColor: '#D97B2C' }}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs" style={{ color: '#9A9590' }}>{p.clientName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, backgroundColor: '#2E2E2E' }}>
                        <div style={{ width: `${p.completionPct}%`, height: '100%', backgroundColor: '#D97B2C' }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#D97B2C' }}>{p.completionPct}%</span>
                    </div>
                  </div>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px] shrink-0">
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Blockchain Entries</h3>
            <Link to="/audit" className="text-sm" style={{ color: '#D97B2C' }}>Full Audit Trail →</Link>
          </div>
          <div className="text-center py-8" style={{ color: '#9A9590' }}>
            <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No blockchain entries yet. Approve an expense to generate one.</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Material Alerts</h3>
            <Link to="/expenses" className="text-sm" style={{ color: '#D97B2C' }}>View Expenses →</Link>
          </div>
          <div className="text-center py-8" style={{ color: '#9A9590' }}>
            <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No material alerts. Expenses will appear here once submitted.</p>
          </div>
        </Card>
      </div>

      {/* Create Project Modal */}
      {showCreate && (
        <CreateProjectModal
          onCreated={p => setProjects(ps => [p, ...ps])}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
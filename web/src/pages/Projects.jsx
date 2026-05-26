import { useState, useEffect } from 'react'
import { MapPin, Calendar, Plus } from 'lucide-react'
import { Button, Card, Badge, Spinner } from '../components/ui/Library'
import { projectsApi } from '../api'

function ProgressBar({ pct, color = '#D97B2C' }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: '#2E2E2E' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', backgroundColor: color }} />
    </div>
  )
}

const statusVariant = {
  ACTIVE: 'success', DRAFT: 'default', COMPLETED: 'blockchain', ARCHIVED: 'default',
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('All')

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    if (filter === 'All')       return true
    if (filter === 'Active')    return p.status === 'ACTIVE'
    if (filter === 'Completed') return p.status === 'COMPLETED'
    if (filter === 'Draft')     return p.status === 'DRAFT'
    return true
  })

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Projects</h1>
        <Button onClick={() => window.location.href = '/dashboard'} className="gap-2">
          <Plus size={16} /> New Project
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['All', 'Active', 'Completed', 'Draft'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: filter === f ? '#D97B2C' : '#2E2E2E',
              color: filter === f ? 'white' : '#9A9590',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#9A9590' }}>
          <p>No projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(project => {
            const isOverBudget = project.status === 'ARCHIVED'
            const color = isOverBudget ? '#E84B4B' : '#D97B2C'

            return (
              <Card
                key={project.id}
                className="transition-colors"
                style={{ borderColor: isOverBudget ? 'rgba(232,75,75,0.5)' : '#2E2E2E' }}
                onMouseEnter={e => !isOverBudget && (e.currentTarget.style.borderColor = 'rgba(217,123,44,0.5)')}
                onMouseLeave={e => !isOverBudget && (e.currentTarget.style.borderColor = '#2E2E2E')}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {project.name}
                    </h3>
                    <div className="flex items-center text-sm gap-1" style={{ color: '#9A9590' }}>
                      <MapPin size={14} />
                      {project.clientName}
                    </div>
                  </div>
                  <Badge variant={statusVariant[project.status] || 'default'}>
                    {project.status}
                  </Badge>
                </div>

                {/* Budget progress */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: '#9A9590' }}>Overall Completion</span>
                      <span className="font-medium">
                        {project.completionPct}% of ₱{Number(project.budget).toLocaleString()}
                      </span>
                    </div>
                    <ProgressBar pct={project.completionPct} color={color} />
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1" style={{ color: '#9A9590' }}>
                      <Calendar size={14} />
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString()
                        : 'No end date'}
                    </div>
                    {project._count && (
                      <div className="flex gap-3 text-xs" style={{ color: '#9A9590' }}>
                        <span>{project._count.tickets ?? 0} tickets</span>
                        <span>{project._count.expenses ?? 0} expenses</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #2E2E2E' }}>
                  <div className="flex -space-x-2">
                    {['A', 'B', 'C'].map(l => (
                      <div
                        key={l}
                        className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                        style={{ borderColor: '#242424', backgroundColor: '#2E2E2E' }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#D97B2C' }}>
                    ₱{Number(project.budget).toLocaleString()} budget
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
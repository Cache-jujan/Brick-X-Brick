import { useState, useEffect } from 'react'
import client from '../api/client'

function TaskUpdatePanel({ task, onUpdated, onClose }) {
  const [pct, setPct] = useState(task.completionPct)
  const [issueText, setIssueText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.post('/api/task-updates', {
        taskId: task.id,
        completionPct: pct,
        issueText: issueText.trim() || undefined,
      })
      onUpdated({ ...task, completionPct: res.data.completionPct })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{task.name}</h2>
            {task.milestone?.name && (
              <p className="text-xs text-gray-400 mt-0.5">Milestone: {task.milestone.name}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Percentage Slider */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Completion: <span className="text-blue-600 font-bold">{pct}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={e => setPct(Number(e.target.value))}
          className="w-full accent-blue-600 mb-4"
        />
        <div className="flex justify-between text-xs text-gray-400 -mt-3 mb-5">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        {/* Progress bar preview */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Issue Text */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue / Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Describe any blockers or issues…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={issueText}
          onChange={e => setIssueText(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit Update'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ pct }) {
  if (pct === 100) return <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Done</span>
  if (pct > 0) return <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">In Progress</span>
  return <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Not Started</span>
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    // Get current user id from JWT stored token/context
    // Assuming a /api/auth/me endpoint returns the current user
    client.get('/api/auth/me')
      .then(res => {
        const userId = res.data.id
        return client.get(`/api/tasks?assignedTo=${userId}`)
      })
      .then(res => setTasks(res.data))
      .catch((err) => {
  if (err.response?.status === 404) {
    setError('Tasks API not ready yet — waiting on backend (Carl H3)')
  } else {
    setError('Failed to load your tasks')
  }
})
      .finally(() => setLoading(false))
  }, [])

  const handleUpdated = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    setSelectedTask(null)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Tasks</h1>
        <p className="text-sm text-gray-500 mb-6">Submit progress updates for your assigned tasks</p>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading your tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 font-medium">No tasks assigned to you yet</p>
            <p className="text-gray-400 text-sm">Check back once the Project Manager assigns tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-300 transition cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{task.name}</span>
                      <StatusBadge pct={task.completionPct} />
                    </div>
                    {task.milestone?.name && (
                      <p className="text-xs text-gray-400 mb-2">Milestone: {task.milestone.name}</p>
                    )}
                    {task.targetDate && (
                      <p className="text-xs text-gray-400">Due: {formatDate(task.targetDate)}</p>
                    )}
                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${task.completionPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{task.completionPct}% complete</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedTask(task) }}
                    className="shrink-0 text-sm text-blue-600 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskUpdatePanel
          task={selectedTask}
          onUpdated={handleUpdated}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
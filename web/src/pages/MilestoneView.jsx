import '../components/project-management.css'
import { useState, useEffect, useCallback } from 'react';
import AddMilestoneModal from '../components/AddMilestoneModal';
import AddTaskModal from '../components/AddTaskModal';
import { apiClient } from '../api/client';

function ProgressBar({ pct, color = 'blue' }) {
  return (
    <div className="progress-track">
      <div
        className={`progress-fill progress-${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function MilestoneStatusBadge({ pct }) {
  if (pct === 100) return <span className="badge badge-done">Complete</span>;
  if (pct > 0) return <span className="badge badge-inprogress">In Progress</span>;
  return <span className="badge badge-pending">Not Started</span>;
}

function TaskStatusBadge({ status }) {
  return (
    <span className={`badge ${status === 'DONE' ? 'badge-done' : 'badge-pending'}`}>
      {status === 'DONE' ? 'Done' : 'Pending'}
    </span>
  );
}

export default function MilestoneView({ project: propProject }) {
  const [project, setProject] = useState(propProject || null)

  useEffect(() => {
    if (!propProject) {
      const stored = localStorage.getItem('selectedProject')
      if (stored) setProject(JSON.parse(stored))
    }
  }, [propProject])

  const [milestones, setMilestones] = useState([])
  const [selectedMilestone, setSelectedMilestone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [updatingTask, setUpdatingTask] = useState(null)
  const [updatePct, setUpdatePct] = useState(0)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')

  const fetchMilestones = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/api/milestones?projectId=${project.id}`);
      const data = Array.isArray(res) ? res : res.data ?? [];
      setMilestones(data);
      if (selectedMilestone) {
        const refreshed = data.find((m) => m.id === selectedMilestone.id);
        if (refreshed) setSelectedMilestone(refreshed);
      } else if (data.length > 0) {
        setSelectedMilestone(data[0]);
      }
    } catch (err) {
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleMilestoneCreated = (milestone) => {
    const newMilestone = { ...milestone, tasks: [] };
    setMilestones((prev) => [...prev, newMilestone]);
    setSelectedMilestone(newMilestone);
    setShowAddMilestone(false);
  };

  const handleTaskCreated = (task) => {
    const updatedMilestone = {
      ...selectedMilestone,
      tasks: [...(selectedMilestone.tasks || []), task],
    };
    setMilestones((prev) =>
      prev.map((m) => m.id === selectedMilestone.id ? updatedMilestone : m)
    );
    setSelectedMilestone(updatedMilestone);
    setShowAddTask(false);
  };

  const handleProgressUpdate = async () => {
    setUpdateError('')
    setUpdateSuccess('')
    if (updatePct < 0 || updatePct > 100) {
      return setUpdateError('Completion percentage must be between 0 and 100.')
    }
    setUpdateLoading(true)
    try {
      await apiClient.post('/api/task-updates', {
        taskId: updatingTask.id,
        completionPct: updatePct,
      })
      const updatedTask = {
        ...updatingTask,
        completionPct: updatePct,
        status: updatePct === 100 ? 'DONE' : 'PENDING',
      }
      const updatedMilestone = {
        ...selectedMilestone,
        tasks: selectedMilestone.tasks.map((t) =>
          t.id === updatingTask.id ? updatedTask : t
        ),
      }
      const newPct = Math.round(
        updatedMilestone.tasks.reduce((s, t) => s + t.completionPct, 0) /
          updatedMilestone.tasks.length
      )
      updatedMilestone.completionPct = newPct
      setSelectedMilestone(updatedMilestone)
      setMilestones((prev) =>
        prev.map((m) => (m.id === selectedMilestone.id ? updatedMilestone : m))
      )
      setUpdateSuccess('Progress updated successfully.')
      setUpdatingTask(null)
    } catch (err) {
      setUpdateError(err.response?.data?.error || 'Failed to update progress.')
    } finally {
      setUpdateLoading(false)
    }
  }

  if (!project) {
    return (
      <div className="empty-view">
        <span className="empty-icon">🏗</span>
        <p>Select a project to view milestones</p>
      </div>
    );
  }

  const tasks = selectedMilestone?.tasks || [];

  return (
    <div className="milestone-view">
      {/* Sidebar */}
      <aside className="milestone-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Milestones</div>
          <button
            className="btn-icon"
            onClick={() => setShowAddMilestone(true)}
            title="Add milestone"
          >
            +
          </button>
        </div>

        {loading && <div className="sidebar-loading">Loading...</div>}
        {error && <div className="sidebar-error">{error}</div>}

        {!loading && milestones.length === 0 && (
          <div className="sidebar-empty">
            <p>No milestones yet</p>
            <button
              className="btn-add-row-empty"
              onClick={() => setShowAddMilestone(true)}
            >
              + Add First Milestone
            </button>
          </div>
        )}

        <ul className="milestone-list">
          {milestones.map((m) => (
            <li
              key={m.id}
              className={`milestone-item ${selectedMilestone?.id === m.id ? 'active' : ''}`}
              onClick={() => setSelectedMilestone(m)}
            >
              <div className="milestone-item-top">
                <span className="milestone-item-name">{m.name}</span>
                <MilestoneStatusBadge pct={m.completionPct} />
              </div>
              <ProgressBar pct={m.completionPct} color="blue" />
              <div className="milestone-item-meta">
                <span>{m.completionPct}% complete</span>
                {m.targetDate && (
                  <span>
                    Due {new Date(m.targetDate).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main */}
      <main className="milestone-main">
        {selectedMilestone ? (
          <>
            <div className="main-header">
              <div className="main-header-left">
                <h2 className="main-title">{selectedMilestone.name}</h2>
                <div className="main-meta">
                  <MilestoneStatusBadge pct={selectedMilestone.completionPct} />
                  <span className="meta-sep" />
                  <span className="meta-pct">{selectedMilestone.completionPct}% complete</span>
                  {selectedMilestone.targetDate && (
                    <>
                      <span className="meta-sep" />
                      <span>
                        Target:{' '}
                        {new Date(selectedMilestone.targetDate).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </>
                  )}
                </div>
                <div className="main-progress-wrap">
                  <ProgressBar pct={selectedMilestone.completionPct} color="blue" />
                </div>
              </div>
              <div className="main-header-right">
                <button className="btn-ghost btn-sm" onClick={fetchMilestones}>
                  ↻ Refresh
                </button>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => setShowAddTask(true)}
                >
                  + Add Task
                </button>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="tasks-empty">
                <span className="empty-icon">📋</span>
                <p>No tasks under this milestone yet.</p>
                <button
                  className="btn-add-row-empty"
                  onClick={() => setShowAddTask(true)}
                >
                  + Add First Task
                </button>
              </div>
            ) : (
              <div className="tasks-table-wrap">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Assigned To</th>
                      <th style={{ width: '160px' }}>Progress</th>
                      <th style={{ width: '90px' }}>Status</th>
                      <th style={{ width: '110px' }}>Target Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => {
                          setUpdatingTask(task)
                          setUpdatePct(task.completionPct)
                          setUpdateError('')
                          setUpdateSuccess('')
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="task-name">{task.name}</td>
                        <td>
                          {task.assignee ? (
                            <div className="assignee-cell">
                              <span className="assignee-avatar">
                                {(task.assignee.name || task.assignee.email || '?')
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                              <span>{task.assignee.name || task.assignee.email}</span>
                            </div>
                          ) : (
                            <span className="unassigned">—</span>
                          )}
                        </td>
                        <td>
                          <div className="task-progress-cell">
                            <ProgressBar pct={task.completionPct} color="green" />
                            <span className="task-pct">{task.completionPct}%</span>
                          </div>
                        </td>
                        <td>
                          <TaskStatusBadge status={task.status} />
                        </td>
                        <td className="task-date">
                          {task.targetDate
                            ? new Date(task.targetDate).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="tasks-empty">
            <span className="empty-icon">←</span>
            <p>Select a milestone to view tasks</p>
          </div>
        )}

        {updatingTask && (
          <div className="update-panel">
            <div className="update-panel-header">
              <div>
                <div className="update-panel-label">Update Progress</div>
                <div className="update-panel-title">{updatingTask.name}</div>
              </div>
              <button
                className="modal-close"
                onClick={() => setUpdatingTask(null)}
              >✕</button>
            </div>
            <div className="update-panel-body">
              <div className="update-pct-display">{updatePct}%</div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={updatePct}
                onChange={(e) => setUpdatePct(Number(e.target.value))}
                className="pct-slider"
              />
              <div className="slider-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              {updatePct === 100 && (
                <div className="done-notice">
                  ✓ Setting to 100% will mark this task as <strong>Done</strong>
                </div>
              )}
              {updateError && (
                <div className="field-error modal-error">⚠ {updateError}</div>
              )}
              {updateSuccess && (
                <div className="success-notice">✓ {updateSuccess}</div>
              )}
              <div className="update-panel-actions">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setUpdatingTask(null)}
                >Cancel</button>
                <button
                  className="btn-primary btn-sm"
                  onClick={handleProgressUpdate}
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddMilestone && (
        <AddMilestoneModal
          projectId={project.id}
          onClose={() => setShowAddMilestone(false)}
          onCreated={handleMilestoneCreated}
        />
      )}

      {showAddTask && selectedMilestone && (
        <AddTaskModal
          milestone={selectedMilestone}
          projectId={project.id}
          onClose={() => setShowAddTask(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export default function AddTaskModal({ milestone, projectId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [siteManagers, setSiteManagers] = useState([]);
  const [loadingSMs, setLoadingSMs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSMs = async () => {
      try {
       const res = await apiClient.get('/api/users?role=SITE_MANAGER');
        setSiteManagers(Array.isArray(res) ? res : res.data ?? []);
      } catch (err) {
        setError('Failed to load site managers');
      } finally {
        setLoadingSMs(false);
      }
    };
    fetchSMs();
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!name.trim()) return setError('Task name is required.');
  if (name.trim().length > 100) return setError('Task name cannot exceed 100 characters.');
  if (!assignedTo) return setError('Please assign a Site Manager to this task.');

  if (targetDate) {
    const selected = new Date(targetDate);
    if (selected < today) return setError('Target date cannot be in the past.');
    if (milestone.targetDate) {
      const milestoneDate = new Date(milestone.targetDate);
      if (selected > milestoneDate) {
        return setError(
          `Task target date cannot be after the milestone due date (${milestoneDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}).`
        );
      }
    }
  }

  setLoading(true);
  try {
    const res = await apiClient.post('/api/tasks', {
      milestoneId: milestone.id,
      projectId,
      name: name.trim(),
      assignedTo,
      targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
    });
    const task = res.data ?? res;
    onCreated(task);
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to create task. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2>Add Task</h2>
            <p className="modal-subtitle">Milestone: {milestone.name}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-field">
              <label>Task Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pour concrete slab — Block A"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label>Assign to Site Manager *</label>
              {loadingSMs ? (
                <div className="loading-inline">Loading managers...</div>
              ) : siteManagers.length === 0 ? (
                <div className="field-error">No site managers found</div>
              ) : (
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">— Select Site Manager —</option>
                  {siteManagers.map((sm) => (
                    <option key={sm.id} value={sm.id}>
                      {sm.name || sm.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-field">
              <label>Target Date <span className="optional-label">(optional)</span></label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            {error && <div className="field-error modal-error">⚠ {error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || loadingSMs}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

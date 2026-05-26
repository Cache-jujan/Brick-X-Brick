import { useState } from 'react';
import { apiClient } from '../api/client';

export default function AddMilestoneModal({ projectId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(targetDate);

  if (!name.trim()) return setError('Milestone name is required.');
  if (name.trim().length > 100) return setError('Milestone name cannot exceed 100 characters.');
  if (!targetDate) return setError('Target date is required.');
  if (selected < today) return setError('Target date cannot be in the past.');

  setLoading(true);
  try {
    const res = await apiClient.post('/api/milestones', {
      projectId,
      name: name.trim(),
      targetDate: new Date(targetDate).toISOString(),
    });
    const milestone = res.data ?? res;
    onCreated(milestone);
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to create milestone. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add Milestone</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-field">
              <label>Milestone Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Foundation Complete"
                autoFocus
              />
            </div>
            <div className="form-field">
              <label>Target Date *</label>
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
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

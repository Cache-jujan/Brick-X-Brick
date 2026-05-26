import '../components/project-management.css'
import { useState } from 'react';
import ProcurementListBuilder from '../components/ProcurementListBuilder';
import { apiClient } from '../api/client';

const initialProjectFields = {
  name: '',
  clientName: '',
  budget: '',
  startDate: '',
  endDate: '',
  description: '',
};

export default function CreateProject({ onSuccess, onCancel }) {
  const [fields, setFields] = useState(initialProjectFields);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const updateField = (key, value) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!fields.name.trim()) errs.name = 'Project name is required';
    if (!fields.clientName.trim()) errs.clientName = 'Client name is required';
    if (!fields.budget || parseFloat(fields.budget) <= 0)
      errs.budget = 'Budget must be greater than 0';
    if (!fields.startDate) errs.startDate = 'Start date is required';
    if (!fields.endDate) errs.endDate = 'End date is required';
    if (fields.startDate && fields.endDate && fields.endDate <= fields.startDate)
      errs.endDate = 'End date must be after start date';
    // Validate procurement items
    items.forEach((item, i) => {
      if (!item.description.trim()) {
        errs[`item_${i}`] = `Item ${i + 1}: description is required`;
      }
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: fields.name.trim(),
        clientName: fields.clientName.trim(),
        budget: parseFloat(fields.budget),
        startDate: new Date(fields.startDate).toISOString(),
        endDate: new Date(fields.endDate).toISOString(),
        description: fields.description.trim(),
        items: items.map((item) => ({
          type: item.type,
          description: item.description.trim(),
          quantity: item.quantity,
        })),
      };

      const project = await apiClient.post('/api/projects', payload);
      if (onSuccess) onSuccess(project);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const itemErrors = Object.entries(errors).filter(([k]) => k.startsWith('item_'));

  return (
    <div className="create-project-page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumb">Projects</div>
          <h1 className="page-title">New Project</h1>
        </div>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="project-form" noValidate>
        {/* Section 1: Project Details */}
        <div className="form-section">
          <div className="section-label">
            <span className="section-num">01</span>
            Project Details
          </div>

          <div className="form-grid">
            <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="name">Project Name *</label>
              <input
                id="name"
                type="text"
                value={fields.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. SM Mall Renovation Phase 2"
                autoFocus
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className={`form-field ${errors.clientName ? 'has-error' : ''}`}>
              <label htmlFor="clientName">Client Name *</label>
              <input
                id="clientName"
                type="text"
                value={fields.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="e.g. SM Prime Holdings"
              />
              {errors.clientName && <span className="field-error">{errors.clientName}</span>}
            </div>

            <div className={`form-field ${errors.budget ? 'has-error' : ''}`}>
              <label htmlFor="budget">Budget (PHP) *</label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">₱</span>
                <input
                  id="budget"
                  type="number"
                  value={fields.budget}
                  onChange={(e) => updateField('budget', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="has-prefix"
                />
              </div>
              {errors.budget && <span className="field-error">{errors.budget}</span>}
            </div>

            <div className="form-field-group">
              <div className={`form-field ${errors.startDate ? 'has-error' : ''}`}>
                <label htmlFor="startDate">Start Date *</label>
                <input
                  id="startDate"
                  type="date"
                  value={fields.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
                {errors.startDate && <span className="field-error">{errors.startDate}</span>}
              </div>

              <div className={`form-field ${errors.endDate ? 'has-error' : ''}`}>
                <label htmlFor="endDate">End Date *</label>
                <input
                  id="endDate"
                  type="date"
                  value={fields.endDate}
                  min={fields.startDate || undefined}
                  onChange={(e) => updateField('endDate', e.target.value)}
                />
                {errors.endDate && <span className="field-error">{errors.endDate}</span>}
              </div>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={fields.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Project scope, objectives, notes..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Procurement List */}
        <div className="form-section">
          <div className="section-label">
            <span className="section-num">02</span>
            Procurement List
            <span className="section-note">Optional — add materials and work items needed</span>
          </div>

          <ProcurementListBuilder items={items} onChange={setItems} />

          {itemErrors.length > 0 && (
            <div className="item-errors">
              {itemErrors.map(([k, v]) => (
                <div key={k} className="field-error">{v}</div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        {submitError && (
          <div className="submit-error">
            <span>⚠</span> {submitError}
          </div>
        )}

        <div className="form-actions">
          <div className="form-summary">
            {items.length > 0 && (
              <span className="summary-badge">
                {items.length} procurement item{items.length !== 1 ? 's' : ''} queued
              </span>
            )}
          </div>
          <div className="form-buttons">
            {onCancel && (
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Creating Project...
                </>
              ) : (
                <>Create Project →</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

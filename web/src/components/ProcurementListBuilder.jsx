import { useState } from 'react';

const TICKET_TYPES = [
  { value: 'MATERIAL_REQUEST', label: 'Material Request' },
  { value: 'WORK_ITEM', label: 'Work Item' },
];

export default function ProcurementListBuilder({ items, onChange }) {
  const addRow = () => {
    onChange([
      ...items,
      { type: 'MATERIAL_REQUEST', description: '', quantity: 1 },
    ]);
  };

  const removeRow = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="procurement-builder">
      <div className="builder-header">
        <div className="builder-title">
          <span className="builder-icon">📋</span>
          Procurement List
          {items.length > 0 && (
            <span className="item-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <button type="button" className="btn-add-row" onClick={addRow}>
          + Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>No procurement items yet.</p>
          <p className="empty-sub">Add materials or work items needed for this project.</p>
          <button type="button" className="btn-add-row-empty" onClick={addRow}>
            + Add First Item
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="procurement-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '180px' }}>Type</th>
                <th>Description</th>
                <th style={{ width: '100px' }}>Quantity</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={`procurement-row ${item.type === 'MATERIAL_REQUEST' ? 'type-material' : 'type-work'}`}>
                  <td className="row-num">{index + 1}</td>
                  <td>
                    <select
                      value={item.type}
                      onChange={(e) => updateRow(index, 'type', e.target.value)}
                      className={`type-select ${item.type === 'MATERIAL_REQUEST' ? 'select-material' : 'select-work'}`}
                    >
                      {TICKET_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRow(index, 'description', e.target.value)}
                      placeholder="e.g. Cement bags, Roofing installation..."
                      className="desc-input"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateRow(index, 'quantity', parseInt(e.target.value) || 1)}
                      min={1}
                      className="qty-input"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeRow(index)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import client from './client'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  me:   ()           => client.get('/api/auth/me').then(r => r.data),
  sync: (name, role) => client.post('/api/auth/sync', { name, role }).then(r => r.data),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (role) => client.get('/api/users', { params: { role } }).then(r => r.data),
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list:   ()       => client.get('/api/projects').then(r => r.data),
  create: (data)   => client.post('/api/projects', data).then(r => r.data),
}

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestonesApi = {
  list:   (projectId) => client.get('/api/milestones', { params: { projectId } }).then(r => r.data),
  create: (data)      => client.post('/api/milestones', data).then(r => r.data),
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list:   (params) => client.get('/api/tasks', { params }).then(r => r.data),
  create: (data)   => client.post('/api/tasks', data).then(r => r.data),
}

// ─── Task Updates ─────────────────────────────────────────────────────────────
export const taskUpdatesApi = {
  create: (data) => client.post('/api/task-updates', data).then(r => r.data),
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list:    (params)   => client.get('/api/tickets', { params }).then(r => r.data),
  get:     (id)       => client.get(`/api/tickets/${id}`).then(r => r.data),
  create:  (data)     => client.post('/api/tickets', data).then(r => r.data),
  resolve: (id)       => client.patch(`/api/tickets/${id}/resolve`).then(r => r.data),
  reject:  (id)       => client.patch(`/api/tickets/${id}/reject`).then(r => r.data),
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expensesApi = {
  list:    (params) => client.get('/api/expenses', { params }).then(r => r.data),
  get:     (id)     => client.get(`/api/expenses/${id}`).then(r => r.data),
  submit:  (data)   => client.post('/api/expenses', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  approve: (id)     => client.patch(`/api/expenses/${id}/approve`).then(r => r.data),
  reject:  (id)     => client.patch(`/api/expenses/${id}/reject`).then(r => r.data),
  split:   (id, allocations) => client.post(`/api/expenses/${id}/split-allocate`, { allocations }).then(r => r.data),
}

// ─── Reports (F11) ────────────────────────────────────────────────────────────
export const reportsApi = {
  generate: (projectIds, from, to) =>
    client.get('/api/reports', {
      params: { projectIds: projectIds.join(','), from, to }
    }).then(r => r.data),
}

// ─── Blockchain (F12) ─────────────────────────────────────────────────────────
export const blockchainApi = {
  verify:    (expenseId) => client.get(`/api/blockchain/verify/${expenseId}`).then(r => r.data),
  auditLogs: (projectId) => client.get('/api/blockchain/audit-logs', { params: { projectId } }).then(r => r.data),
}
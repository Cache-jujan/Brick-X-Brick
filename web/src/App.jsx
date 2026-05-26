import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Projects       from './pages/Projects'
import PMProjects     from './pages/PMProjects'
import Expenses       from './pages/Expenses'
import BlockchainAudit from './pages/BlockchainAudit'
import Reports        from './pages/Reports'
import Admin          from './pages/Admin'

// Auth guard
const getUser = () => {
  try { return JSON.parse(localStorage.getItem('bxb_user')) }
  catch { return null }
}

function PrivateRoute({ children, allowedRoles }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct home
    return <Navigate to={user.redirect} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/"      element={<Navigate to="/login" replace />} />

        {/* GM routes */}
        <Route
          path="/"
          element={
            <PrivateRoute allowedRoles={['GENERAL_MANAGER', 'SYS_ADMIN']}>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects"  element={<Projects />} />
          <Route path="expenses"  element={<Expenses />} />
          <Route path="reports"   element={<Reports />} />
          <Route path="audit"     element={<BlockchainAudit />} />
          <Route path="admin"     element={<Admin />} />
        </Route>

        {/* PM routes */}
        <Route
          path="/pm"
          element={
            <PrivateRoute allowedRoles={['PROJECT_MANAGER']}>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="projects"     element={<PMProjects />} />
          <Route path="projects/:id" element={<PMProjects />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
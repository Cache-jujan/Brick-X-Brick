import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import TicketQueue from './pages/TicketQueue'
import MyTasks from './pages/MyTasks'
import CreateProject from './pages/CreateProject'
import MilestoneView from './pages/MilestoneView'

const isLoggedIn = () => !!localStorage.getItem('token')

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/tickets" element={<PrivateRoute><TicketQueue /></PrivateRoute>} />
        <Route path="/my-tasks" element={<PrivateRoute><MyTasks /></PrivateRoute>} />
        <Route path="/create-project" element={<PrivateRoute><CreateProject /></PrivateRoute>} />
        <Route path="/milestones" element={<PrivateRoute><MilestoneView /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Pages — lazy loaded
import StudentHome from './pages/student/Home'
import StudentAsk from './pages/student/Ask'
import StudentAnswer from './pages/student/Answer'
import StudentHistory from './pages/student/History'
import ParentDashboard from './pages/parent/Dashboard'
import ParentReport from './pages/parent/Report'
import TeacherQueue from './pages/teacher/Queue'
import TeacherSession from './pages/teacher/Session'
import AdminDashboard from './pages/admin/Dashboard'

export default function App() {
  const { user } = useAuthStore()

  return (
    <Routes>
      {/* Student */}
      <Route path="/student" element={<StudentHome />} />
      <Route path="/student/ask" element={<StudentAsk />} />
      <Route path="/student/answer/:id" element={<StudentAnswer />} />
      <Route path="/student/history" element={<StudentHistory />} />

      {/* Parent */}
      <Route path="/parent" element={<ParentDashboard />} />
      <Route path="/parent/report/:week" element={<ParentReport />} />

      {/* Teacher */}
      <Route path="/teacher/queue" element={<TeacherQueue />} />
      <Route path="/teacher/session/:id" element={<TeacherSession />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* Default */}
      <Route path="/" element={<Navigate to="/student" replace />} />
    </Routes>
  )
}

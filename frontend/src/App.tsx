import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Members from '@/pages/Members'
import Events from '@/pages/Events'
import Finances from '@/pages/Finances'
import Reports from '@/pages/Reports'
import Devotionals from '@/pages/Devotionals'
import Observations from '@/pages/Observations'
import Profile from '@/pages/Profile'
import EventDetails from '@/pages/EventDetails'
import DevotionalDetails from '@/pages/DevotionalDetails'
import ObservationDetails from '@/pages/ObservationDetails'
import Rehearsals from '@/pages/Rehearsals'
import Attendance from '@/pages/Attendance'
import Groups from '@/pages/Groups'
import Scales from '@/pages/Scales'
import GroupDetails from '@/pages/GroupDetails'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Members Management */}
          <Route 
            path="/members" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Members />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Events />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/events/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <EventDetails />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finances" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Finances />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/devotionals" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Devotionals />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/devotionals/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <DevotionalDetails />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/observations" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Observations />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/observations/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ObservationDetails />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rehearsals" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Rehearsals />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance/:id" 
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Groups />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <GroupDetails />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scales" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Scales />
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App

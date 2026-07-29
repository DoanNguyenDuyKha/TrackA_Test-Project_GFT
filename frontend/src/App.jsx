import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages Import
import Login from './pages/Login';
import Register from './pages/Register';
import PlacementTest from './pages/PlacementTest';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import AssignmentsList from './pages/AssignmentsList';
import Task2ArticleDetail from './pages/Task2ArticleDetail';
import Workspace from './pages/Workspace';
import InteractiveResult from './pages/InteractiveResult';
import LecturesList from './pages/LecturesList';
import AdminAssignments from './pages/AdminAssignments';
import AdminStudentsMonitor from './pages/AdminStudentsMonitor';
import AdminDashboard from './pages/AdminDashboard';
import AdminResources from './pages/AdminResources';
import StudentResources from './pages/StudentResources';

import StudentResourceDetail from './pages/StudentResourceDetail';


const HomeRoute = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <StudentDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Student & Admin Protected Routes */}
              <Route
                path="/placement-test"
                element={
                  <ProtectedRoute>
                    <PlacementTest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomeRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <ProtectedRoute>
                    <AssignmentsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignment/:id"
                element={
                  <ProtectedRoute>
                    <Task2ArticleDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/:id"
                element={
                  <ProtectedRoute>
                    <Workspace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results/:id"
                element={
                  <ProtectedRoute>
                    <InteractiveResult />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/resources"
                element={
                  <ProtectedRoute>
                    <StudentResources />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/resources/:id"
                element={
                  <ProtectedRoute>
                    <StudentResourceDetail />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}

              <Route
                path="/admin/assignments"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminStudentsMonitor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/resources"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminResources />
                  </ProtectedRoute>
                }
              />
            </Routes>

          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

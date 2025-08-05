import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import PersonsList from './components/persons/PersonsList';
import PersonForm from './components/persons/PersonForm';
import PersonDetail from './components/persons/PersonDetail';
import ReportsList from './components/reports/ReportsList';
import ReportForm from './components/reports/ReportForm';
import ReportDetail from './components/reports/ReportDetail';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './i18n'; // Initialize i18n
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          
                          {/* Persons routes */}
                          <Route path="/persons" element={<PersonsList />} />
                          <Route path="/persons/new" element={<PersonForm />} />
                          <Route path="/persons/:id" element={<PersonDetail />} />
                          <Route path="/persons/:id/edit" element={<PersonForm />} />
                          
                          {/* Reports routes */}
                          <Route path="/reports" element={<ReportsList />} />
                          <Route path="/reports/new" element={<ReportForm />} />
                          <Route path="/reports/:id" element={<ReportDetail />} />
                          <Route path="/reports/:id/edit" element={<ReportForm />} />
                          
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

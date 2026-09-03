import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ClinicProvider } from './context/ClinicContext'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/ui/ToastContainer'
import ProtectedRoute from './components/admin/ProtectedRoute'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'

// Public pages
import HomePage from './pages/public/HomePage'
import ServicesPage from './pages/public/ServicesPage'
import ServiceDetailPage from './pages/public/ServiceDetailPage'
import AboutPage from './pages/public/AboutPage'
import AppointmentPage from './pages/public/AppointmentPage'
import ContactPage from './pages/public/ContactPage'

// Admin pages
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import AppointmentsPage from './pages/admin/AppointmentsPage'
import CalendarPage from './pages/admin/CalendarPage'
import ClientsPage from './pages/admin/ClientsPage'
import ClientDetailPage from './pages/admin/ClientDetailPage'
import TestimonialsPage from './pages/admin/TestimonialsPage'
import SettingsPage from './pages/admin/SettingsPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ClinicProvider>
            <ToastProvider>
              <Routes>
                {/* Public website */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/services/:slug" element={<ServiceDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/appointment" element={<AppointmentPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                </Route>

                {/* Admin login (no layout) */}
                <Route path="/admin/login" element={<LoginPage />} />

                {/* Protected admin area */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="clients/:id" element={<ClientDetailPage />} />
                  <Route path="testimonials" element={<TestimonialsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              <ToastContainer />
            </ToastProvider>
          </ClinicProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

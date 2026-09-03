import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  TrendingUp, ChevronRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { dashboardApi } from '../../services/dashboardApi'
import type { DashboardStats, Appointment } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/ui/StatusBadge'
import { parseApiError, formatDate, formatTime } from '../../utils/errorHandler'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#14b8a6', '#ef4444', '#6b7280']

function StatCard({ icon: Icon, label, value, color, to }: {
  icon: typeof Users; label: string; value: number; color: string; to?: string
}) {
  const content = (
    <div className="card hover:border-primary-500/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    dashboardApi.getStats()
      .then((r) => { if (r.success && r.data) setStats(r.data) })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = 'Dashboard | Dental Oasis Admin'
    load()
  }, [])

  if (loading) return <PageLoader />
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>
  if (!stats) return null

  const statCards = [
    { icon: Users, label: 'Total Clients', value: stats.total_clients, color: 'bg-primary-600', to: '/admin/clients' },
    { icon: Calendar, label: 'Total Appointments', value: stats.total_appointments, color: 'bg-teal-600', to: '/admin/appointments' },
    { icon: AlertCircle, label: 'Pending Requests', value: stats.pending_appointments, color: 'bg-yellow-600' },
    { icon: CheckCircle, label: 'Confirmed', value: stats.confirmed_appointments, color: 'bg-green-600' },
    { icon: Clock, label: "Today's Appointments", value: stats.today_appointments.length, color: 'bg-blue-600' },
    { icon: TrendingUp, label: 'Completed', value: stats.completed_appointments, color: 'bg-indigo-600' },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Overview of Dental Oasis clinic activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Appointments — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.trend_chart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid #263354', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Appointments by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.status_chart.filter(s => s.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                nameKey="status"
              >
                {stats.status_chart.filter(s => s.count > 0).map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid #263354', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Today's Appointments</h2>
          <Link to="/admin/appointments" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View All <ChevronRight size={12} />
          </Link>
        </div>
        {stats.today_appointments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No appointments scheduled for today.</p>
        ) : (
          <ul className="space-y-3">
            {stats.today_appointments.map((appt: Appointment) => (
              <li key={appt.id} className="flex items-center justify-between gap-4 py-2.5 border-b border-dark-500 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-14 text-center">
                    <p className="text-xs font-semibold text-primary-300">{appt.appointment_time ? formatTime(appt.appointment_time) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{appt.patient_name}</p>
                    <p className="text-xs text-gray-400">{appt.reason}</p>
                  </div>
                </div>
                <StatusBadge status={appt.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Upcoming */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Upcoming Appointments</h2>
          <Link to="/admin/calendar" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
            Calendar <ChevronRight size={12} />
          </Link>
        </div>
        {stats.upcoming_appointments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No upcoming confirmed appointments.</p>
        ) : (
          <ul className="space-y-3">
            {stats.upcoming_appointments.map((appt: Appointment) => (
              <li key={appt.id} className="flex items-center justify-between gap-4 py-2.5 border-b border-dark-500 last:border-0">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{appt.patient_name}</p>
                    <p className="text-xs text-gray-400">{appt.reason}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-300">{formatDate(appt.appointment_date)}</p>
                  <p className="text-xs text-primary-300">{appt.appointment_time ? formatTime(appt.appointment_time) : ''}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Contacted', value: stats.contacted_appointments, color: 'text-blue-300' },
          { label: 'Cancelled', value: stats.cancelled_appointments, color: 'text-red-300' },
          { label: 'No Show', value: stats.no_show_appointments, color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

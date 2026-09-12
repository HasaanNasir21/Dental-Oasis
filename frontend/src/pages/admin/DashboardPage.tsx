import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, Clock, CheckCircle, AlertCircle,
  TrendingUp, ChevronRight, DollarSign, CreditCard, Wallet, AlertTriangle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { dashboardApi } from '../../services/dashboardApi'
import type { DashboardStats, Appointment, ClinicMonthlyTotals } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/ui/StatusBadge'
import { parseApiError, formatDate, formatTime } from '../../utils/errorHandler'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#14b8a6', '#ef4444', '#6b7280']

function StatCard({
  icon: Icon, label, value, color, to, sub,
}: {
  icon: typeof Users
  label: string
  value: string | number
  color: string
  to?: string
  sub?: string
}) {
  const content = (
    <div className="card hover:border-primary-500/30 transition-colors h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 mb-1 truncate">{label}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color} flex-shrink-0 ml-2`}>
          <Icon size={18} className="text-white" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
  return to ? <Link to={to} className="block">{content}</Link> : <div>{content}</div>
}

function PaymentTrioCard({
  label,
  charged,
  paid,
  pending,
  subLabel,
}: {
  label: string
  charged: number
  paid: number
  pending: number
  subLabel?: string
}) {
  const fmt = (n: number) => `Rs. ${Number(n).toLocaleString()}`
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={16} className="text-emerald-400" />
        <h2 className="text-base font-semibold text-white">{label}</h2>
        {subLabel && <span className="text-xs text-gray-500 ml-1">({subLabel})</span>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-dark-700 rounded-xl p-3 text-center border border-dark-500">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={12} className="text-blue-400" />
            <p className="text-xs text-gray-400">Charged</p>
          </div>
          <p className="text-lg font-bold text-blue-300">{fmt(charged)}</p>
        </div>
        <div className="bg-dark-700 rounded-xl p-3 text-center border border-dark-500">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Wallet size={12} className="text-emerald-400" />
            <p className="text-xs text-gray-400">Paid</p>
          </div>
          <p className="text-lg font-bold text-emerald-300">{fmt(paid)}</p>
        </div>
        <div className="bg-dark-700 rounded-xl p-3 text-center border border-dark-500">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle size={12} className="text-amber-400" />
            <p className="text-xs text-gray-400">Pending</p>
          </div>
          <p className={`text-lg font-bold ${pending > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
            {pending > 0 ? fmt(pending) : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

function ArchivedMonthsTable({ months }: { months: ClinicMonthlyTotals[] }) {
  const fmt = (n: number) => `Rs. ${Number(n).toLocaleString()}`
  if (months.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No archived months yet. The first archive runs automatically on the 1st of next month.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-500 text-left text-xs text-gray-400 uppercase">
            <th className="py-2 pr-4">Month</th>
            <th className="py-2 pr-4 text-right">Charged</th>
            <th className="py-2 pr-4 text-right">Paid</th>
            <th className="py-2 pr-4 text-right">Pending</th>
            <th className="py-2 pr-4 text-right">Patients</th>
            <th className="py-2 text-right">Appts</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={`${m.year}-${m.month}`} className="border-b border-dark-600 hover:bg-dark-700/40">
              <td className="py-2.5 pr-4 text-white font-medium">{m.month_label}</td>
              <td className="py-2.5 pr-4 text-right text-blue-300">{fmt(m.total_charged)}</td>
              <td className="py-2.5 pr-4 text-right text-emerald-300">{fmt(m.total_paid)}</td>
              <td className={`py-2.5 pr-4 text-right font-medium ${m.total_pending > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                {m.total_pending > 0 ? fmt(m.total_pending) : '—'}
              </td>
              <td className="py-2.5 pr-4 text-right text-gray-300">{m.patient_count}</td>
              <td className="py-2.5 text-right text-gray-300">{m.appointment_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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
    {
      icon: Users,
      label: 'Total Patients',
      value: stats.total_clients,
      color: 'bg-primary-600',
      to: '/admin/clients',
    },
    {
      icon: Calendar,
      label: 'Total Appointments',
      value: stats.total_appointments,
      color: 'bg-teal-600',
      to: '/admin/appointments',
    },
    {
      icon: AlertCircle,
      label: 'Pending Requests',
      value: stats.pending_appointments,
      color: 'bg-yellow-600',
    },
    {
      icon: CheckCircle,
      label: 'Confirmed',
      value: stats.confirmed_appointments,
      color: 'bg-green-600',
    },
    {
      icon: Clock,
      label: "Today's Appointments",
      value: stats.today_appointments.length,
      color: 'bg-blue-600',
    },
    {
      icon: TrendingUp,
      label: 'Completed',
      value: stats.completed_appointments,
      color: 'bg-indigo-600',
    },
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

      {/* ── Payment section ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Payments</h2>
        </div>

        <div className="mb-4">
          {/* Current month */}
          <PaymentTrioCard
            label="This Month"
            subLabel={stats.current_month_label}
            charged={stats.current_month_charged}
            paid={stats.current_month_paid}
            pending={stats.current_month_pending}
          />
        </div>

        {/* Monthly history table */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Monthly Payment History</h3>
          <ArchivedMonthsTable months={stats.archived_months} />
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────────────────── */}
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
                data={stats.status_chart.filter((s) => s.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                nameKey="status"
              >
                {stats.status_chart.filter((s) => s.count > 0).map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f1629', border: '1px solid #263354', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Today's Appointments</h2>
          <Link
            to="/admin/appointments"
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            View All <ChevronRight size={12} />
          </Link>
        </div>
        {stats.today_appointments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No appointments scheduled for today.
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.today_appointments.map((appt: Appointment) => (
              <li
                key={appt.id}
                className="flex items-center justify-between gap-4 py-2.5 border-b border-dark-500 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 text-center">
                    <p className="text-xs font-semibold text-primary-300">
                      {appt.appointment_time ? formatTime(appt.appointment_time) : '—'}
                    </p>
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
          <Link
            to="/admin/calendar"
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            Calendar <ChevronRight size={12} />
          </Link>
        </div>
        {stats.upcoming_appointments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No upcoming confirmed appointments.
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.upcoming_appointments.map((appt: Appointment) => (
              <li
                key={appt.id}
                className="flex items-center justify-between gap-4 py-2.5 border-b border-dark-500 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-white">{appt.patient_name}</p>
                  <p className="text-xs text-gray-400">{appt.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-300">{formatDate(appt.appointment_date)}</p>
                  <p className="text-xs text-primary-300">
                    {appt.appointment_time ? formatTime(appt.appointment_time) : ''}
                  </p>
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

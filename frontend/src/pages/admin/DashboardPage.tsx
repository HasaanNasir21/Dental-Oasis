import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, Clock, CheckCircle, AlertCircle,
  TrendingUp, ChevronRight, Banknote, History, CreditCard, MessageCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { dashboardApi } from '../../services/dashboardApi'
import type { DashboardStats, Appointment, ClinicMonthlyTotals, PaymentLogEntry } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/ui/StatusBadge'
import { parseApiError, formatDate, formatTime } from '../../utils/errorHandler'

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#14b8a6', '#ef4444', '#6b7280']

/** Open WhatsApp with a pre-filled appointment reminder message */
function openWhatsApp(appt: Appointment) {
  // Normalize: strip all non-digit characters, then add country code if not present
  const digits = appt.contact_number.replace(/\D/g, '')
  const number = digits.startsWith('92') ? digits : digits.startsWith('0') ? `92${digits.slice(1)}` : `92${digits}`
  const time = appt.appointment_time ? formatTime(appt.appointment_time) : ''
  const msg = [
    `Assalam-o-Alaikum ${appt.patient_name},`,
    '',
    `This is a reminder that you have an appointment at Dental Oasis today${time ? ` at ${time}` : ''}.`,
    `Treatment: ${appt.reason}`,
    '',
    'We look forward to seeing you! If you need to reschedule, please contact us.',
    '',
    '— Dental Oasis',
  ].join('\n')
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
}

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

  const monthlyPaid = stats.current_month_paid ?? 0
  const monthlyCharged = stats.current_month_charged ?? 0
  const monthlyLabel = stats.current_month_label ?? ''

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

      {/* This Month's Revenue */}
      <div className="card border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-dark-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={16} className="text-emerald-400" aria-hidden="true" />
              <p className="text-sm font-semibold text-emerald-300">This Month's Revenue</p>
              <span className="text-xs text-gray-500">({monthlyLabel})</span>
            </div>
            <p className="text-3xl font-bold text-white">
              Rs. {monthlyPaid.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total paid this month · resets on the 1st
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-600/20 flex-shrink-0 ml-4">
            <Banknote size={28} className="text-emerald-400" aria-hidden="true" />
          </div>
        </div>
        {/* Mini breakdown */}
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-500/10">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">Total Billed</p>
            <p className="text-base font-bold text-blue-300">Rs. {monthlyCharged.toLocaleString()}</p>
          </div>
          <div className="text-center border-x border-emerald-500/10">
            <p className="text-xs text-gray-500 mb-0.5">Amount Paid</p>
            <p className="text-base font-bold text-emerald-300">Rs. {monthlyPaid.toLocaleString()}</p>
          </div>
          <div className="text-center border-r border-emerald-500/10">
            <p className="text-xs text-gray-500 mb-0.5">Appointments</p>
            <p className="text-base font-bold text-white">{stats.current_month_appointments}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">Patients Seen</p>
            <p className="text-base font-bold text-white">{stats.current_month_patients}</p>
          </div>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={appt.status} />
                  <button
                    type="button"
                    onClick={() => openWhatsApp(appt)}
                    title={`Send WhatsApp message to ${appt.patient_name}`}
                    aria-label={`Send WhatsApp message to ${appt.patient_name}`}
                    className="p-1.5 rounded-lg bg-green-600/15 hover:bg-green-600/30 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <MessageCircle size={15} />
                  </button>
                </div>
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

      {/* Current Month Payment Log */}
      {stats.current_month_payment_log && stats.current_month_payment_log.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-emerald-400" aria-hidden="true" />
            <h2 className="text-base font-semibold text-white">Payment Log</h2>
            <span className="text-xs text-gray-500 ml-1">— {monthlyLabel} · resets on the 1st</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Every payment recorded this month, sorted by date.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Current month payment log">
              <thead>
                <tr className="border-b border-dark-500">
                  {['Date', 'Patient', 'Treatment', 'Total Billed', 'Paid', 'Pending'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats.current_month_payment_log as PaymentLogEntry[]).map((entry, idx) => {
                  const pending = entry.pending_amount
                  return (
                    <tr
                      key={`${entry.appointment_id}-${idx}`}
                      className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">
                        {entry.appointment_date ? formatDate(entry.appointment_date) : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">
                        {entry.patient_name}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                        {entry.reason}
                      </td>
                      <td className="px-3 py-2.5 text-blue-300 whitespace-nowrap">
                        {entry.total_amount != null
                          ? `Rs. ${Number(entry.total_amount).toLocaleString()}`
                          : <span className="text-gray-600">—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-emerald-300 whitespace-nowrap">
                        Rs. {Number(entry.amount_paid).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {pending == null || pending === 0 ? (
                          <span className="text-sm font-semibold text-emerald-400">Rs. 0</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                            Due Rs. {Number(pending).toLocaleString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals footer */}
              {(() => {
                const log = stats.current_month_payment_log as PaymentLogEntry[]
                const totalPaid = log.reduce((s, e) => s + e.amount_paid, 0)
                const totalBilled = log.reduce((s, e) => s + (e.total_amount ?? 0), 0)
                return (
                  <tfoot>
                    <tr className="border-t border-dark-400">
                      <td colSpan={3} className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
                        Month Total
                      </td>
                      <td className="px-3 pt-3 pb-1 text-sm font-bold text-blue-300 whitespace-nowrap">
                        Rs. {totalBilled.toLocaleString()}
                      </td>
                      <td className="px-3 pt-3 pb-1 text-sm font-bold text-emerald-300 whitespace-nowrap">
                        Rs. {totalPaid.toLocaleString()}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )
              })()}
            </table>
          </div>
        </div>
      )}

      {/* Monthly Revenue History */}
      {stats.archived_months && stats.archived_months.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <History size={16} className="text-primary-400" aria-hidden="true" />
            <h2 className="text-base font-semibold text-white">Monthly Revenue History</h2>
            <span className="text-xs text-gray-500 ml-1">— saved snapshots (last 12 months)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Monthly revenue history">
              <thead>
                <tr className="border-b border-dark-500">
                  {['Month', 'Amount Paid', 'Total Billed', 'Appointments', 'Patients'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats.archived_months as ClinicMonthlyTotals[]).map((m) => (
                  <tr
                    key={`${m.year}-${m.month}`}
                    className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">
                      {m.month_label}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-300 whitespace-nowrap">
                      Rs. {Number(m.total_paid).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-blue-300 whitespace-nowrap">
                      Rs. {Number(m.total_charged).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">
                      {m.appointment_count}
                    </td>
                    <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">
                      {m.patient_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

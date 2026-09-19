import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Phone, MessageCircle, Plus, Save, AlertCircle, Calendar,
  DollarSign, TrendingUp, Wallet, AlertTriangle, History, RefreshCw,
} from 'lucide-react'
import { clientApi } from '../../services/clientApi'
import { monthlyPaymentApi } from '../../services/monthlyPaymentApi'
import type { Appointment, Client, MonthlyPaymentSummary } from '../../types'
import { APPOINTMENT_REASONS, APPOINTMENT_STATUSES } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import TimeSlotSelect from '../../components/ui/TimeSlotSelect'
import { parseApiError, formatDate, formatTime } from '../../utils/errorHandler'
import { useToast } from '../../context/ToastContext'
import AppointmentDetailModal from '../../components/admin/AppointmentDetailModal'

const appointmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time is required'),
  status: z.string().min(1),
  notes: z.string().max(5000).optional().or(z.literal('')),
})
type AppointmentForm = z.infer<typeof appointmentSchema>

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function rs(val: number | null | undefined) {
  if (val == null) return '—'
  return `Rs. ${Number(val).toLocaleString()}`
}

function PaymentBadge({ total, paid }: { total: number | null; paid: number | null }) {
  // Neither field set — nothing to show
  if (total == null && paid == null) return <span className="text-gray-600 text-xs">—</span>
  // Installment: paid recorded but no total set on this appointment
  if (total == null && paid != null && paid > 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">Installment</span>
  }
  const t = total ?? 0
  const p = paid ?? 0
  const pending = Math.max(t - p, 0)
  if (pending === 0 && p > 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">Paid</span>
  }
  if (pending > 0) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">Due Rs.{pending.toLocaleString()}</span>
  }
  return <span className="text-gray-600 text-xs">—</span>
}

function ClientAppointmentForm({
  client,
  onClose,
  onSaved,
}: {
  client: Client
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { showToast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { reason: 'Checkup', status: 'CONFIRMED', notes: '' },
  })

  const onSubmit = async (values: AppointmentForm) => {
    setServerError(null)
    try {
      await clientApi.createAppointment(client.id, {
        patient_name: client.name,
        contact_number: client.contact_number,
        address: client.address || undefined,
        reason: values.reason,
        status: values.status as Appointment['status'],
        appointment_date: values.appointment_date,
        appointment_time: values.appointment_time,
        notes: values.notes || undefined,
      })
      showToast('Appointment created successfully.')
      onSaved()
      onClose()
    } catch (e) {
      setServerError(parseApiError(e))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`New appointment for ${client.name}`} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="reason">Reason</label>
          <select id="reason" className="input" {...register('reason')}>
            {APPOINTMENT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.reason && <p className="field-error">{errors.reason.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="appointment_date">Date</label>
            <input id="appointment_date" type="date" className="input" {...register('appointment_date')} />
            {errors.appointment_date && <p className="field-error">{errors.appointment_date.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="appointment_time">Time</label>
            <TimeSlotSelect id="appointment_time" className="input" {...register('appointment_time')} />
            {errors.appointment_time && <p className="field-error">{errors.appointment_time.message}</p>}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" className="input" {...register('status')}>
            {APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea id="notes" rows={3} className="input resize-none" {...register('notes')} />
        </div>
        {serverError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2" role="alert">
            <AlertCircle size={14} className="text-red-400 mt-0.5" />
            <p className="text-sm text-red-300">{serverError}</p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
            {isSubmitting ? <LoadingSpinner size="sm" /> : <Save size={14} />}
            {isSubmitting ? 'Saving...' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Current month payment summary for this patient ──────────────────────────
function CurrentMonthPaymentCard({ appointments }: { appointments: Appointment[] }) {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1

  const thisMonthAppts = appointments.filter((a) => {
    if (!a.appointment_date) return false
    const d = new Date(a.appointment_date)
    const inMonth = d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth
    const billable = a.status === 'CONFIRMED' || a.status === 'COMPLETED'
    return inMonth && billable
  })

  const totalCharged = thisMonthAppts.reduce((s, a) => s + (a.total_amount ?? 0), 0)
  const totalPaid = thisMonthAppts.reduce((s, a) => s + (a.amount_paid ?? 0), 0)
  const totalPending = Math.max(totalCharged - totalPaid, 0)

  if (thisMonthAppts.length === 0) return null

  return (
    <div className="p-4 bg-dark-700 rounded-xl border border-dark-500">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={14} className="text-emerald-400" />
        <p className="text-sm font-semibold text-white">
          {MONTH_NAMES[thisMonth]} {thisYear} — Current Month
        </p>
        <span className="text-xs text-gray-500 ml-auto">{thisMonthAppts.length} appointment{thisMonthAppts.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-dark-600 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp size={10} className="text-blue-400" />
            <p className="text-xs text-gray-400">Charged</p>
          </div>
          <p className="text-sm font-bold text-blue-300">{rs(totalCharged)}</p>
        </div>
        <div className="bg-dark-600 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Wallet size={10} className="text-emerald-400" />
            <p className="text-xs text-gray-400">Paid</p>
          </div>
          <p className="text-sm font-bold text-emerald-300">{rs(totalPaid)}</p>
        </div>
        <div className="bg-dark-600 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <AlertTriangle size={10} className="text-amber-400" />
            <p className="text-xs text-gray-400">Pending</p>
          </div>
          <p className={`text-sm font-bold ${totalPending > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
            {totalPending > 0 ? rs(totalPending) : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlyPaymentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedApptId, setSelectedApptId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'appointments' | 'payments'>('appointments')
  const [rollingOver, setRollingOver] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    const clientId = Number(id)
    setLoading(true)
    setError(null)
    Promise.all([
      clientApi.getById(clientId),
      clientApi.getAppointments(clientId),
      monthlyPaymentApi.getPatientHistory(clientId, 24),
    ])
      .then(([clientRes, apptsRes, summaryRes]) => {
        if (clientRes.success && clientRes.data) setClient(clientRes.data)
        if (apptsRes.success && apptsRes.data) setAppointments(apptsRes.data)
        if (summaryRes.success && summaryRes.data) setMonthlySummaries(summaryRes.data)
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    document.title = 'Patient Profile | Dental Oasis Admin'
    load()
  }, [load])

  const handleManualRollover = async () => {
    setRollingOver(true)
    try {
      const res = await monthlyPaymentApi.triggerRollover()
      if (res.success) {
        showToast(res.data?.message || 'Rollover completed.')
        load()
      }
    } catch (e) {
      showToast(parseApiError(e))
    } finally {
      setRollingOver(false)
    }
  }

  if (loading) return <PageLoader />
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>
  if (!client) return <div className="p-6"><EmptyState title="Patient not found." /></div>

  const wa = `https://wa.me/${client.contact_number.replace(/\D/g, '')}`

  return (
    <div className="p-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate('/admin/clients')}
        className="btn-ghost text-sm mb-4"
      >
        <ArrowLeft size={16} /> Back to patients
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{client.name}</h1>
          <p className="text-sm text-gray-400 mt-1">Patient profile, appointments &amp; payment history</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} /> New Appointment
        </button>
      </div>

      {/* Patient info */}
      <section className="card mb-6">
        <h2 className="text-base font-semibold text-white mb-4">Patient Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-gray-500">Name</dt>
            <dd className="text-white font-medium">{client.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Contact Number</dt>
            <dd className="flex items-center gap-2 text-white font-medium">
              {client.contact_number}
              <a href={`tel:${client.contact_number}`} className="text-green-400" aria-label="Call patient">
                <Phone size={14} />
              </a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="text-teal-400" aria-label="WhatsApp patient">
                <MessageCircle size={14} />
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Address</dt>
            <dd className="text-gray-300">{client.address || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Added</dt>
            <dd className="text-gray-300">{formatDate(client.created_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-500">Notes</dt>
            <dd className="text-gray-300">{client.notes || '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Current month snapshot */}
      {appointments.length > 0 && (
        <div className="mb-6">
          <CurrentMonthPaymentCard appointments={appointments} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-dark-700 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'appointments'
              ? 'bg-dark-500 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Calendar size={14} />
          Appointments
          {appointments.length > 0 && (
            <span className="ml-1 text-xs bg-dark-400 text-gray-300 rounded-full px-1.5 py-0.5">
              {appointments.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-dark-500 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <History size={14} />
          Payment History
          {monthlySummaries.length > 0 && (
            <span className="ml-1 text-xs bg-dark-400 text-gray-300 rounded-full px-1.5 py-0.5">
              {monthlySummaries.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Appointments tab ─────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <section className="card">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-primary-400" />
            Appointment History
          </h2>
          {appointments.length === 0 ? (
            <EmptyState
              title="No appointments on record for this patient."
              action={
                <button type="button" onClick={() => setShowForm(true)} className="btn-primary text-sm">
                  Create Appointment
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-500 text-left text-xs text-gray-400 uppercase">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Charged</th>
                    <th className="py-2 pr-4 text-right">Paid</th>
                    <th className="py-2 pr-4 text-right">Pending</th>
                    <th className="py-2 text-center">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Precompute patient-wide billable totals so installment rows
                    // (no total_amount on that visit) can show cumulative figures.
                    const billableAll = appointments.filter(
                      (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED'
                    )
                    const patientTotalCharged = billableAll.reduce((s, a) => s + (a.total_amount ?? 0), 0)
                    const patientTotalPaid    = billableAll.reduce((s, a) => s + (a.amount_paid  ?? 0), 0)
                    const patientPending      = Math.max(patientTotalCharged - patientTotalPaid, 0)

                    return appointments.map((appt) => {
                      const isInstallment = appt.total_amount == null && (appt.amount_paid ?? 0) > 0
                      const billable = appt.status === 'CONFIRMED' || appt.status === 'COMPLETED'

                      // For installment rows, show patient-wide cumulative figures (dimmed)
                      // so the doctor always sees the full treatment cost and balance.
                      const displayCharged = isInstallment && billable ? patientTotalCharged : appt.total_amount
                      const displayPaid    = appt.amount_paid
                      const displayPending = isInstallment && billable
                        ? patientPending
                        : appt.total_amount != null
                          ? Math.max(appt.total_amount - (appt.amount_paid ?? 0), 0)
                          : null

                      return (
                        <tr
                          key={appt.id}
                          className="border-b border-dark-600 hover:bg-dark-700/40 cursor-pointer"
                          onClick={() => setSelectedApptId(appt.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedApptId(appt.id)}
                          aria-label={`Edit appointment for ${appt.patient_name}`}
                        >
                          <td className="py-3 pr-4 text-white">
                            {appt.appointment_date ? formatDate(appt.appointment_date) : formatDate(appt.created_at)}
                          </td>
                          <td className="py-3 pr-4 text-gray-300">{formatTime(appt.appointment_time)}</td>
                          <td className="py-3 pr-4 text-gray-300">{appt.reason}</td>
                          <td className="py-3 pr-4"><StatusBadge status={appt.status} /></td>
                          <td className="py-3 pr-4 text-right">
                            {isInstallment && billable ? (
                              <span className="text-blue-300/70 italic text-xs" title="Cumulative treatment total">
                                {rs(displayCharged)}
                              </span>
                            ) : (
                              <span className="text-blue-300">{rs(displayCharged)}</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right text-emerald-300">{rs(displayPaid)}</td>
                          <td className={`py-3 pr-4 text-right font-medium ${
                            displayPending == null ? 'text-gray-500'
                            : displayPending > 0   ? 'text-amber-300'
                                                   : 'text-emerald-400'
                          }`}>
                            {displayPending == null ? '—'
                              : displayPending > 0  ? rs(displayPending)
                                                    : 'Rs. 0'}
                          </td>
                          <td className="py-3 text-center">
                            <PaymentBadge total={appt.total_amount} paid={appt.amount_paid} />
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
                {/* Totals footer — only CONFIRMED + COMPLETED appointments */}
                {(() => {
                  const billable = appointments.filter(
                    (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED'
                  )
                  const tc = billable.reduce((s, a) => s + (a.total_amount ?? 0), 0)
                  const tp = billable.reduce((s, a) => s + (a.amount_paid ?? 0), 0)
                  const tpnd = Math.max(tc - tp, 0)
                  return (
                    <tfoot>
                      <tr className="border-t border-dark-400 text-xs font-semibold">
                        <td colSpan={4} className="pt-3 pr-4 text-gray-400 uppercase">Billable totals (Confirmed + Completed)</td>
                        <td className="pt-3 pr-4 text-right text-blue-300">{rs(tc)}</td>
                        <td className="pt-3 pr-4 text-right text-emerald-300">{rs(tp)}</td>
                        <td className={`pt-3 pr-4 text-right ${tpnd > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                          {tpnd > 0 ? rs(tpnd) : '—'}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )
                })()}
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Payment History tab ───────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <History size={16} className="text-primary-400" />
              Monthly Payment History
            </h2>
            <button
              type="button"
              onClick={handleManualRollover}
              disabled={rollingOver}
              className="btn-ghost text-xs flex items-center gap-1.5"
              title="Archive previous month's payments now"
            >
              {rollingOver ? <LoadingSpinner size="sm" /> : <RefreshCw size={12} />}
              Archive Previous Month
            </button>
          </div>

          {monthlySummaries.length === 0 ? (
            <EmptyState
              title="No archived payment history yet."
              description="Monthly summaries are archived automatically on the 1st of each month."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-500 text-left text-xs text-gray-400 uppercase">
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4 text-right">Charged</th>
                    <th className="py-2 pr-4 text-right">Paid</th>
                    <th className="py-2 pr-4 text-right">Pending</th>
                    <th className="py-2 text-right">Appointments</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummaries.map((s) => (
                    <tr key={s.id} className="border-b border-dark-600 hover:bg-dark-700/40">
                      <td className="py-2.5 pr-4 text-white font-medium">
                        {MONTH_NAMES[s.month]} {s.year}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-blue-300">{rs(s.total_charged)}</td>
                      <td className="py-2.5 pr-4 text-right text-emerald-300">{rs(s.total_paid)}</td>
                      <td className={`py-2.5 pr-4 text-right font-medium ${s.total_pending > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                        {s.total_pending > 0 ? rs(s.total_pending) : '—'}
                      </td>
                      <td className="py-2.5 text-right text-gray-300">{s.appointment_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      {showForm && (
        <ClientAppointmentForm
          client={client}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}

      {selectedApptId != null && (
        <AppointmentDetailModal
          appointmentId={selectedApptId}
          onClose={() => setSelectedApptId(null)}
          onUpdated={load}
          allAppointments={appointments}
        />
      )}
    </div>
  )
}

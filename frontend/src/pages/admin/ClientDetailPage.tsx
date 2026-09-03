import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Phone, MessageCircle, Plus, Save, AlertCircle, Calendar,
} from 'lucide-react'
import { clientApi } from '../../services/clientApi'
import type { Appointment, Client } from '../../types'
import { APPOINTMENT_REASONS, APPOINTMENT_STATUSES } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { parseApiError, formatDate, formatTime } from '../../utils/errorHandler'
import { useToast } from '../../context/ToastContext'

const appointmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time is required'),
  status: z.string().min(1),
  notes: z.string().max(5000).optional().or(z.literal('')),
})
type AppointmentForm = z.infer<typeof appointmentSchema>

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      reason: 'Checkup',
      status: 'CONFIRMED',
      notes: '',
    },
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
            {APPOINTMENT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
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
            <input id="appointment_time" type="time" className="input" {...register('appointment_time')} />
            {errors.appointment_time && <p className="field-error">{errors.appointment_time.message}</p>}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" className="input" {...register('status')}>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
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

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    const clientId = Number(id)
    setLoading(true)
    setError(null)
    Promise.all([clientApi.getById(clientId), clientApi.getAppointments(clientId)])
      .then(([clientRes, apptsRes]) => {
        if (clientRes.success && clientRes.data) setClient(clientRes.data)
        if (apptsRes.success && apptsRes.data) setAppointments(apptsRes.data)
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    document.title = 'Client Profile | Dental Oasis Admin'
    load()
  }, [load])

  if (loading) return <PageLoader />
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>
  if (!client) return <div className="p-6"><EmptyState title="Client not found." /></div>

  const wa = `https://wa.me/${client.contact_number.replace(/\D/g, '')}`

  return (
    <div className="p-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate('/admin/clients')}
        className="btn-ghost text-sm mb-4"
      >
        <ArrowLeft size={16} /> Back to clients
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{client.name}</h1>
          <p className="text-sm text-gray-400 mt-1">Client profile and appointment history</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} /> New Appointment
        </button>
      </div>

      <section className="card mb-6">
        <h2 className="text-base font-semibold text-white mb-4">Client Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-gray-500">Name</dt>
            <dd className="text-white font-medium">{client.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Contact Number</dt>
            <dd className="flex items-center gap-2 text-white font-medium">
              {client.contact_number}
              <a href={`tel:${client.contact_number}`} className="text-green-400" aria-label="Call client">
                <Phone size={14} />
              </a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="text-teal-400" aria-label="WhatsApp client">
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

      <section className="card">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-primary-400" />
          Appointment History
        </h2>
        {appointments.length === 0 ? (
          <EmptyState
            title="No appointments on record for this client."
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
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b border-dark-600">
                    <td className="py-3 pr-4 text-white">{appt.appointment_date ? formatDate(appt.appointment_date) : formatDate(appt.created_at)}</td>
                    <td className="py-3 pr-4 text-gray-300">{formatTime(appt.appointment_time)}</td>
                    <td className="py-3 pr-4 text-gray-300">{appt.reason}</td>
                    <td className="py-3 pr-4"><StatusBadge status={appt.status} /></td>
                    <td className="py-3 text-gray-500 max-w-xs truncate">{appt.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <ClientAppointmentForm
          client={client}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}

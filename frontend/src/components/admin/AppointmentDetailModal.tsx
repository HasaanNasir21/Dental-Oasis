import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, MessageCircle, Save, AlertCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import LoadingSpinner, { PageLoader } from '../ui/LoadingSpinner'
import StatusBadge from '../ui/StatusBadge'
import { appointmentApi } from '../../services/appointmentApi'
import type { Appointment } from '../../types'
import { APPOINTMENT_REASONS, APPOINTMENT_STATUSES } from '../../types'
import { parseApiError, formatDate, formatTime } from '../../utils/errorHandler'
import { getStatusLabel } from '../../utils/statusHelpers'
import { useToast } from '../../context/ToastContext'

const schema = z.object({
  status: z.string(),
  appointment_date: z.string().optional().or(z.literal('')),
  appointment_time: z.string().optional().or(z.literal('')),
  reason: z.string().optional(),
  notes: z.string().max(5000).optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

interface Props {
  appointmentId: number
  onClose: () => void
  onUpdated: () => void
}

export default function AppointmentDetailModal({ appointmentId, onClose, onUpdated }: Props) {
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const { showToast } = useToast()

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    appointmentApi.getById(appointmentId)
      .then((r) => {
        if (r.success && r.data) {
          setAppt(r.data)
          reset({
            status: r.data.status,
            appointment_date: r.data.appointment_date || '',
            appointment_time: r.data.appointment_time || '',
            reason: r.data.reason,
            notes: r.data.notes || '',
          })
        }
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [appointmentId, reset])

  const onSubmit = async (values: FormValues) => {
    if (!appt) return
    setSaving(true)
    setFormError(null)
    try {
      await appointmentApi.update(appt.id, {
        status: values.status as Appointment['status'],
        appointment_date: values.appointment_date || null,
        appointment_time: values.appointment_time || null,
        reason: values.reason,
        notes: values.notes || undefined,
      })
      showToast('Appointment updated successfully.')
      onUpdated()
      onClose()
    } catch (e) {
      setFormError(parseApiError(e))
    } finally {
      setSaving(false)
    }
  }

  const waLink = appt?.contact_number
    ? `https://wa.me/${appt.contact_number.replace(/\D/g, '')}`
    : null

  return (
    <Modal isOpen onClose={onClose} title="Appointment Details" size="lg">
      {loading ? (
        <PageLoader />
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : appt ? (
        <div className="space-y-6">
          {/* Patient info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Patient Name</p>
              <p className="text-white font-medium">{appt.patient_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Contact Number</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{appt.contact_number}</p>
                <div className="flex gap-1">
                  <a
                    href={`tel:${appt.contact_number}`}
                    className="p-1 rounded text-gray-500 hover:text-green-400 transition-colors"
                    aria-label={`Call ${appt.patient_name}`}
                  >
                    <Phone size={14} />
                  </a>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-gray-500 hover:text-green-400 transition-colors"
                      aria-label={`WhatsApp ${appt.patient_name}`}
                    >
                      <MessageCircle size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Address</p>
              <p className="text-gray-300 text-sm">{appt.address || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
              <p className="text-gray-300 text-sm">{formatDate(appt.created_at)}</p>
            </div>
            {appt.other_problem && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Additional Problem</p>
                <p className="text-gray-300 text-sm">{appt.other_problem}</p>
              </div>
            )}
          </div>

          <hr className="border-dark-500" />

          {/* Edit form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="label text-xs" htmlFor="appt-status">Status</label>
                <select id="appt-status" className="input text-sm" {...register('status')}>
                  {APPOINTMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
              {/* Reason */}
              <div>
                <label className="label text-xs" htmlFor="appt-reason">Reason</label>
                <select id="appt-reason" className="input text-sm" {...register('reason')}>
                  {APPOINTMENT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {/* Date */}
              <div>
                <label className="label text-xs" htmlFor="appt-date">Appointment Date</label>
                <input id="appt-date" type="date" className="input text-sm" {...register('appointment_date')} />
              </div>
              {/* Time */}
              <div>
                <label className="label text-xs" htmlFor="appt-time">Appointment Time</label>
                <input id="appt-time" type="time" className="input text-sm" {...register('appointment_time')} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label text-xs" htmlFor="appt-notes">Notes</label>
              <textarea id="appt-notes" rows={3} className="input text-sm resize-none" placeholder="Internal notes..." {...register('notes')} />
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2" role="alert">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{formError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Modal>
  )
}

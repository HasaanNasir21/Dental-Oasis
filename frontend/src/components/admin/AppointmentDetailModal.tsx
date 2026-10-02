import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, MessageCircle, Save, AlertCircle, DollarSign, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react'
import Modal from '../ui/Modal'
import LoadingSpinner, { PageLoader } from '../ui/LoadingSpinner'
import TimeSlotSelect from '../ui/TimeSlotSelect'
import TreatmentSelect from '../ui/TreatmentSelect'
import { appointmentApi } from '../../services/appointmentApi'
import { clientApi } from '../../services/clientApi'
import AppointmentFiles from './AppointmentFiles'
import type { Appointment, AppointmentFile } from '../../types'
import { APPOINTMENT_STATUSES } from '../../types'
import { parseApiError, formatDate } from '../../utils/errorHandler'
import { getStatusLabel } from '../../utils/statusHelpers'
import { useToast } from '../../context/ToastContext'

const amountField = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), {
    message: 'Enter a valid amount (e.g. 1500 or 1500.00)',
  })

const schema = z.object({
  status: z.string(),
  appointment_date: z.string().optional().or(z.literal('')),
  appointment_time: z.string().optional().or(z.literal('')),
  treatments: z.array(z.string()).min(1, 'Select at least one treatment'),
  notes: z.string().max(5000).optional().or(z.literal('')),
  total_amount: amountField,
  amount_paid: amountField,
})

type FormValues = z.infer<typeof schema>

interface Props {
  appointmentId: number
  onClose: () => void
  onUpdated: () => void
  /** All appointments for this patient — used to show cumulative payment summary */
  allAppointments?: Appointment[]
}

function rs(val: number | null | undefined) {
  if (val == null) return '—'
  return `Rs. ${Number(val).toLocaleString()}`
}

export default function AppointmentDetailModal({ appointmentId, onClose, onUpdated, allAppointments }: Props) {
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [files, setFiles] = useState<AppointmentFile[]>([])
  const { showToast } = useToast()

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { treatments: [] },
  })

  // Watch date so the TimeSlotSelect can fetch available slots reactively
  const watchedDate = watch('appointment_date')
  const watchedTotal = watch('total_amount')
  const watchedPaid = watch('amount_paid')

  // Live pending calculation from form values.
  const livePending = (() => {
    const t = parseFloat(watchedTotal || '0') || (appt?.total_amount ?? 0)
    const p = parseFloat(watchedPaid || '0') || 0
    const diff = t - p
    return diff > 0 ? diff : 0
  })()

  // Cumulative patient-level totals across ALL their appointments (billable only).
  const [fetchedPatientAppts, setFetchedPatientAppts] = useState<Appointment[] | null>(null)

  useEffect(() => {
    if (allAppointments !== undefined) return
    if (!appt?.client_id) return
    clientApi.getAppointments(appt.client_id)
      .then((r) => { if (r.success && r.data) setFetchedPatientAppts(r.data) })
      .catch(() => { /* non-critical */ })
  }, [appt?.client_id, allAppointments])

  const resolvedPatientAppts = allAppointments ?? fetchedPatientAppts ?? []

  const patientTotals = (() => {
    if (resolvedPatientAppts.length === 0) return null
    const billable = resolvedPatientAppts.filter(
      (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED'
    )
    if (billable.length === 0) return null
    const totalCharged = billable.reduce((s, a) => s + (a.total_amount ?? 0), 0)
    const totalPaid = billable.reduce((s, a) => s + (a.amount_paid ?? 0), 0)
    const totalPending = Math.max(totalCharged - totalPaid, 0)
    return totalCharged > 0 || totalPaid > 0 ? { totalCharged, totalPaid, totalPending } : null
  })()

  const showPatientSummary = patientTotals != null && appt?.total_amount == null

  useEffect(() => {
    appointmentApi.getById(appointmentId)
      .then((r) => {
        if (r.success && r.data) {
          setAppt(r.data)
          setFiles(r.data.files ?? [])

          // Resolve treatments: use the multi-treatment list if present,
          // otherwise fall back to [reason] from the legacy single field.
          const initialTreatments =
            r.data.treatments && r.data.treatments.length > 0
              ? r.data.treatments
              : r.data.reason
              ? [r.data.reason]
              : []

          reset({
            status: r.data.status,
            appointment_date: r.data.appointment_date || '',
            appointment_time: r.data.appointment_time || '',
            treatments: initialTreatments,
            notes: r.data.notes || '',
            total_amount: r.data.total_amount != null ? String(r.data.total_amount) : '',
            amount_paid: r.data.amount_paid != null ? String(r.data.amount_paid) : '',
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
      const resolvedTotal = values.total_amount
        ? parseFloat(values.total_amount)
        : appt.total_amount ?? null

      // Keep reason in sync with the first treatment for backward compatibility
      const primaryReason = values.treatments[0] ?? appt.reason

      await appointmentApi.update(appt.id, {
        status: values.status as Appointment['status'],
        appointment_date: values.appointment_date || null,
        appointment_time: values.appointment_time || null,
        reason: primaryReason,
        treatments: values.treatments,
        notes: values.notes || undefined,
        total_amount: resolvedTotal,
        amount_paid: values.amount_paid ? parseFloat(values.amount_paid) : null,
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

              {/* Date */}
              <div>
                <label className="label text-xs" htmlFor="appt-date">Appointment Date</label>
                <input id="appt-date" type="date" className="input text-sm" {...register('appointment_date')} />
              </div>
            </div>

            {/* Time — date-aware: only shows available slots for the selected date */}
            <div>
              <label className="label text-xs" htmlFor="appt-time">Appointment Time</label>
              <Controller
                name="appointment_time"
                control={control}
                render={({ field }) => (
                  <TimeSlotSelect
                    id="appt-time"
                    className="input text-sm"
                    selectedDate={watchedDate && /^\d{4}-\d{2}-\d{2}$/.test(watchedDate) ? watchedDate : undefined}
                    excludeAppointmentId={appointmentId}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              />
            </div>

            {/* Treatments — multi-select */}
            <div>
              <label className="label text-xs" htmlFor="appt-treatments">
                Treatment(s)
              </label>
              <Controller
                name="treatments"
                control={control}
                render={({ field }) => (
                  <TreatmentSelect
                    id="appt-treatments"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.treatments && (
                <p className="text-xs text-red-400 mt-1">{errors.treatments.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="label text-xs" htmlFor="appt-notes">Notes</label>
              <textarea
                id="appt-notes"
                rows={3}
                className="input text-sm resize-none"
                placeholder="Internal notes..."
                {...register('notes')}
              />
            </div>

            {/* Patient-level cumulative summary */}
            {showPatientSummary && patientTotals && (
              <div className="p-3 bg-dark-700/60 rounded-xl border border-primary-500/20 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-primary-400" />
                  <p className="text-xs font-semibold text-primary-300">Patient Overall Balance</p>
                  <span className="text-xs text-gray-500 ml-1">— across all appointments</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-dark-600 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Total Billed</p>
                    <p className="text-sm font-bold text-blue-300">{rs(patientTotals.totalCharged)}</p>
                  </div>
                  <div className="bg-dark-600 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Total Paid</p>
                    <p className="text-sm font-bold text-emerald-300">{rs(patientTotals.totalPaid)}</p>
                  </div>
                  <div className="bg-dark-600 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Still Pending</p>
                    <p className={`text-sm font-bold ${patientTotals.totalPending > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                      {patientTotals.totalPending > 0 ? rs(patientTotals.totalPending) : 'Rs. 0'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment section */}
            <div className="p-4 bg-dark-700 rounded-xl border border-dark-500 space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-400" />
                <p className="text-sm font-semibold text-white">Payment</p>
                <span className="text-xs text-gray-500 ml-1">
                  {appt.total_amount == null ? '— recording installment' : '(optional)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Total amount charged */}
                <div>
                  <label className="label text-xs" htmlFor="appt-total">Total Charged</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                      Rs.
                    </span>
                    <input
                      id="appt-total"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`input text-sm pl-10 ${errors.total_amount ? 'border-red-500' : ''}`}
                      placeholder={appt.total_amount == null ? 'Not set on this visit' : 'Treatment cost'}
                      {...register('total_amount')}
                    />
                  </div>
                  {errors.total_amount && (
                    <p className="text-xs text-red-400 mt-1">{errors.total_amount.message}</p>
                  )}
                </div>

                {/* Amount paid */}
                <div>
                  <label className="label text-xs" htmlFor="appt-paid">Amount Paid</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                      Rs.
                    </span>
                    <input
                      id="appt-paid"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`input text-sm pl-10 ${errors.amount_paid ? 'border-red-500' : ''}`}
                      placeholder="Amount received"
                      {...register('amount_paid')}
                    />
                  </div>
                  {errors.amount_paid && (
                    <p className="text-xs text-red-400 mt-1">{errors.amount_paid.message}</p>
                  )}
                </div>
              </div>

              {/* Live pending summary */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-dark-600 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <TrendingUp size={11} className="text-blue-400" />
                    <p className="text-xs text-gray-400">
                      {showPatientSummary ? 'Total Billed' : 'Charged'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-blue-300">
                    {showPatientSummary && patientTotals
                      ? rs(patientTotals.totalCharged)
                      : rs(parseFloat(watchedTotal || '0') || appt.total_amount || null)
                    }
                  </p>
                </div>
                <div className="bg-dark-600 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <TrendingDown size={11} className="text-emerald-400" />
                    <p className="text-xs text-gray-400">
                      {showPatientSummary ? 'Total Paid' : 'Paid'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">
                    {showPatientSummary && patientTotals
                      ? rs(patientTotals.totalPaid)
                      : rs(parseFloat(watchedPaid || '0') || null)
                    }
                  </p>
                </div>
                <div className="bg-dark-600 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Minus size={11} className="text-amber-400" />
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                  {showPatientSummary && patientTotals ? (
                    <p className={`text-sm font-semibold ${patientTotals.totalPending > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                      {patientTotals.totalPending > 0 ? rs(patientTotals.totalPending) : 'Rs. 0'}
                    </p>
                  ) : (
                    <p className={`text-sm font-semibold ${livePending > 0 ? 'text-amber-300' : 'text-gray-400'}`}>
                      {livePending > 0 ? `Rs. ${livePending.toLocaleString()}` : '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments — x-rays, scans, PDFs */}
            <hr className="border-dark-500" />
            <AppointmentFiles
              appointmentId={appointmentId}
              files={files}
              onFilesChanged={setFiles}
            />

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

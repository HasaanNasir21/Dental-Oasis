import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, X, Eye, Trash2, MessageSquare, Share2, Copy, Check } from 'lucide-react'
import { appointmentApi } from '../../services/appointmentApi'
import type { AppointmentListItem, PaginationMeta } from '../../types'
import { APPOINTMENT_REASONS, APPOINTMENT_STATUSES } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/ui/StatusBadge'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import AppointmentDetailModal from '../../components/admin/AppointmentDetailModal'
import { parseApiError, formatDate, formatTime } from '../../utils/errorHandler'
import { useToast } from '../../context/ToastContext'
import { getStatusLabel } from '../../utils/statusHelpers'

// ---- Message Modal ----
function AppointmentMessageModal({
  appt,
  onClose,
}: {
  appt: AppointmentListItem
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const message = [
    `Appointment Confirmation – Dental Oasis`,
    ``,
    `Dear ${appt.patient_name},`,
    ``,
    `Your appointment at Dental Oasis has been successfully confirmed.`,
    ``,
    `Treatment: ${appt.reason}`,
    `Date: ${appt.appointment_date ? formatDate(appt.appointment_date) : '—'}`,
    `Time: ${appt.appointment_time ? formatTime(appt.appointment_time) : '—'}`,
    ``,
    `Please arrive a few minutes before your scheduled appointment time.`,
    ``,
    `We look forward to seeing you.`,
    ``,
    `Dental Oasis`,
  ].join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = message
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: message })
      } catch {
        // user cancelled share — do nothing
      }
    } else {
      // Fallback: open WhatsApp web with the message pre-filled
      const encoded = encodeURIComponent(message)
      window.open(`https://wa.me/?text=${encoded}`, '_blank')
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Confirmation Message" size="md">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Message is ready to send. Copy it or use the Share button to send via WhatsApp, SMS, or any app.
        </p>

        {/* Message preview */}
        <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
          <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
            {message}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-sm"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="btn-ghost text-sm flex items-center gap-2"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [reasonFilter, setReasonFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [messageAppt, setMessageAppt] = useState<AppointmentListItem | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { showToast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    appointmentApi.list({
      page,
      page_size: 20,
      status: statusFilter || undefined,
      reason: reasonFilter || undefined,
      search: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
      .then((r) => {
        setAppointments(r.data)
        setMeta(r.meta)
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [page, statusFilter, reasonFilter, search, dateFrom, dateTo])

  useEffect(() => {
    document.title = 'Appointments | Dental Oasis Admin'
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSearchChange = (val: string) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('')
    setReasonFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await appointmentApi.delete(deleteId)
      showToast('Appointment deleted successfully.')
      setDeleteId(null)
      load()
    } catch (e) {
      showToast(parseApiError(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const hasFilters = search || statusFilter || reasonFilter || dateFrom || dateTo

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Appointments</h1>
        <p className="text-sm text-gray-400 mt-1">Manage and track all appointment requests</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
            <input
              type="search"
              className="input pl-9 text-sm"
              placeholder="Search by name or contact..."
              defaultValue={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search appointments"
            />
          </div>
          {/* Status filter */}
          <select
            className="input text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
          {/* Reason filter */}
          <select
            className="input text-sm"
            value={reasonFilter}
            onChange={(e) => { setReasonFilter(e.target.value); setPage(1) }}
            aria-label="Filter by reason"
          >
            <option value="">All Reasons</option>
            {APPOINTMENT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {/* Reset */}
          {hasFilters && (
            <button onClick={resetFilters} className="btn-ghost text-sm justify-center">
              <X size={14} /> Reset
            </button>
          )}
        </div>
        {/* Date range */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label text-xs">From Date</label>
            <input type="date" className="input text-sm" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} aria-label="Filter from date" />
          </div>
          <div>
            <label className="label text-xs">To Date</label>
            <input type="date" className="input text-sm" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} aria-label="Filter to date" />
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : appointments.length === 0 ? (
        <EmptyState title={hasFilters ? 'No appointments match your filters.' : 'No appointment requests yet.'} />
      ) : (
        <>
          {/* Table */}
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Appointments table">
              <thead>
                <tr className="border-b border-dark-500">
                  {['Patient', 'Contact', 'Reason', 'Status', 'Date & Time', 'Submitted', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{appt.patient_name}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{appt.contact_number}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{appt.reason}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {appt.appointment_date ? (
                        <>
                          <span className="text-gray-300">{formatDate(appt.appointment_date)}</span>
                          {appt.appointment_time && (
                            <span className="text-primary-400 ml-2">{formatTime(appt.appointment_time)}</span>
                          )}
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(appt.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedId(appt.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-dark-500 transition-colors"
                          aria-label={`View appointment for ${appt.patient_name}`}
                        >
                          <Eye size={15} />
                        </button>
                        {/* Message button — only for CONFIRMED appointments with date & time */}
                        {appt.status === 'CONFIRMED' && appt.appointment_date && appt.appointment_time && (
                          <button
                            onClick={() => setMessageAppt(appt)}
                            className="p-1.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            aria-label={`Send confirmation message to ${appt.patient_name}`}
                            title="Send confirmation message"
                          >
                            <MessageSquare size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(appt.id)}
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label={`Delete appointment for ${appt.patient_name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <Pagination meta={meta} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedId && (
        <AppointmentDetailModal
          appointmentId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}

      {/* Message modal */}
      {messageAppt && (
        <AppointmentMessageModal
          appt={messageAppt}
          onClose={() => setMessageAppt(null)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        isLoading={deleting}
      />
    </div>
  )
}

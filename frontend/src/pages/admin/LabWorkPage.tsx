import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search, Plus, Edit2, Trash2, X, Save, AlertCircle, FlaskConical,
  Filter, ChevronDown,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { labWorkApi } from '../../services/labWorkApi'
import type {
  LabWork, LabWorkListItem, PaginationMeta, LabWorkType, LabWorkStatus,
} from '../../types'
import { LAB_WORK_TYPES, LAB_WORK_STATUSES } from '../../types'
import TeethSelector from '../../components/admin/TeethSelector'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import { parseApiError, formatDate } from '../../utils/errorHandler'
import { useToast } from '../../context/ToastContext'

// ---- Schema ----
const labWorkSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required').max(255),
  work_type: z.string(),
  status: z.string(),
  work_date: z.string().min(1, 'Date is required'),
  notes: z.string().max(5000).optional().or(z.literal('')),
})
type LabWorkFormValues = z.infer<typeof labWorkSchema>

const todayStr = () => new Date().toISOString().split('T')[0]

// ---- FDI → readable label map (e.g. "15" → "UR5") ----
const FDI_LABEL: Record<string, string> = {}
;[...Array(8)].forEach((_, i) => {
  const pos = String(i + 1)
  FDI_LABEL[`1${pos}`] = `UR${pos}`
  FDI_LABEL[`2${pos}`] = `UL${pos}`
  FDI_LABEL[`3${pos}`] = `LL${pos}`
  FDI_LABEL[`4${pos}`] = `LR${pos}`
})

// ---- Status badge colors ----
const statusColors: Record<string, string> = {
  'Pending': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  'In Progress': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  'Completed': 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
}

// ---- Work type badge colors ----
const workTypeColors: Record<string, string> = {
  'PFM':      'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  '3D PFM':   'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  'Zirconia': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  'E-Max':    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  'Dentures': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  'Aligner':  'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  'Inlay':    'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  'CC Plate': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  'Other':    'bg-gray-500/20 text-gray-300 border border-gray-500/30',
}

// ---- Lab Work Form Modal ----
function LabWorkFormModal({
  record,
  onClose,
  onSaved,
}: {
  record: LabWork | null
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [teeth, setTeeth] = useState<string[]>(record?.teeth ?? [])
  const { showToast } = useToast()
  const isEdit = !!record

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LabWorkFormValues>({
    resolver: zodResolver(labWorkSchema),
    defaultValues: {
      patient_name: record?.patient_name ?? '',
      work_type: record?.work_type ?? 'PFM',
      status: record?.status ?? 'Pending',
      work_date: record?.work_date ?? todayStr(),
      notes: record?.notes ?? '',
    },
  })

  const onSubmit = async (values: LabWorkFormValues) => {
    setServerError(null)
    try {
      const payload = {
        patient_name: values.patient_name,
        work_type: values.work_type as LabWorkType,
        teeth,
        status: values.status as LabWorkStatus,
        work_date: values.work_date,
        notes: values.notes || undefined,
      }
      if (isEdit && record) {
        await labWorkApi.update(record.id, payload)
        showToast('Laboratory work updated successfully.')
      } else {
        await labWorkApi.create(payload)
        showToast('Laboratory work created successfully.')
      }
      onSaved()
      onClose()
    } catch (e) {
      setServerError(parseApiError(e))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Laboratory Work' : 'New Laboratory Work'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Patient name */}
        <div>
          <label className="label" htmlFor="lw-patient">Patient Name <span className="text-red-400">*</span></label>
          <input
            id="lw-patient"
            type="text"
            className={`input ${errors.patient_name ? 'border-red-500' : ''}`}
            placeholder="e.g. Hasaan Nasir"
            {...register('patient_name')}
          />
          {errors.patient_name && <p className="field-error">{errors.patient_name.message}</p>}
        </div>

        {/* Work type + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="lw-type">Work Type <span className="text-red-400">*</span></label>
            <select id="lw-type" className="input" {...register('work_type')}>
              {LAB_WORK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lw-status">Status <span className="text-red-400">*</span></label>
            <select id="lw-status" className="input" {...register('status')}>
              {LAB_WORK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="label" htmlFor="lw-date">Date <span className="text-red-400">*</span></label>
          <input
            id="lw-date"
            type="date"
            max={todayStr()}
            className={`input ${errors.work_date ? 'border-red-500' : ''}`}
            {...register('work_date')}
          />
          {errors.work_date && <p className="field-error">{errors.work_date.message}</p>}
        </div>

        {/* Teeth Selector */}
        <div>
          <label className="label">Select Teeth (FDI Numbering)</label>
          <TeethSelector value={teeth} onChange={setTeeth} />
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="lw-notes">Notes / Instructions</label>
          <textarea
            id="lw-notes"
            rows={3}
            className="input resize-none"
            placeholder="Optional — any special instructions or notes"
            {...register('notes')}
          />
        </div>

        {serverError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2" role="alert">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{serverError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
            {isSubmitting ? <LoadingSpinner size="sm" /> : <Save size={14} />}
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---- Filter Bar ----
function FilterBar({
  search, onSearchChange,
  workType, onWorkTypeChange,
  status, onStatusChange,
  fromDate, onFromDateChange,
  toDate, onToDateChange,
  onClear,
  hasFilters,
}: {
  search: string
  onSearchChange: (v: string) => void
  workType: string
  onWorkTypeChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  fromDate: string
  onFromDateChange: (v: string) => void
  toDate: string
  onToDateChange: (v: string) => void
  onClear: () => void
  hasFilters: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card mb-6">
      {/* Search row */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <input
            type="search"
            className="input pl-9 text-sm"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search lab work"
          />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn-ghost text-sm flex items-center gap-1.5"
        >
          <Filter size={14} />
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full bg-primary-400" />}
          <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {hasFilters && (
          <button onClick={onClear} className="btn-ghost text-sm">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-dark-500">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Work Type</label>
            <select className="input text-sm" value={workType} onChange={(e) => onWorkTypeChange(e.target.value)}>
              <option value="">All types</option>
              {LAB_WORK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select className="input text-sm" value={status} onChange={(e) => onStatusChange(e.target.value)}>
              <option value="">All statuses</option>
              {LAB_WORK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input type="date" className="input text-sm" value={fromDate} max={toDate || todayStr()} onChange={(e) => onFromDateChange(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input type="date" className="input text-sm" value={toDate} min={fromDate || undefined} max={todayStr()} onChange={(e) => onToDateChange(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Status Summary Cards ----
function StatusSummaryCards({ records }: { records: LabWorkListItem[] }) {
  const counts = { 'Pending': 0, 'In Progress': 0, 'Completed': 0 }
  records.forEach((r) => {
    if (r.status in counts) counts[r.status as keyof typeof counts]++
  })

  const cards = [
    { label: 'Pending', value: counts['Pending'], color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'In Progress', value: counts['In Progress'], color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Completed', value: counts['Completed'], color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Total', value: records.length, color: 'text-primary-400', bg: 'bg-primary-500/10' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, color, bg }) => (
        <div key={label} className="card flex items-center gap-3">
          <div className={`p-2.5 ${bg} rounded-lg`}>
            <FlaskConical size={18} className={color} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- Main Page ----
export default function LabWorkPage() {
  const [records, setRecords] = useState<LabWorkListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [workType, setWorkType] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  // Modals
  const [formRecord, setFormRecord] = useState<LabWork | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { showToast } = useToast()

  const hasFilters = !!(search || workType || status || fromDate || toDate)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    labWorkApi.list({
      page,
      page_size: 20,
      search: search || undefined,
      work_type: workType || undefined,
      status: status || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    })
      .then((r) => { setRecords(r.data); setMeta(r.meta) })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [page, search, workType, status, fromDate, toDate])

  useEffect(() => { document.title = 'Laboratory Work | Dental Oasis Admin' }, [])
  useEffect(() => { load() }, [load])

  const handleSearchChange = (val: string) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const clearFilters = () => {
    setSearch('')
    setWorkType('')
    setStatus('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await labWorkApi.delete(deleteId)
      showToast('Laboratory work deleted successfully.')
      setDeleteId(null)
      load()
    } catch (e) {
      showToast(parseApiError(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const openEdit = async (id: number) => {
    try {
      const res = await labWorkApi.getById(id)
      if (res.data) setFormRecord(res.data)
    } catch (e) {
      showToast(parseApiError(e), 'error')
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Laboratory Work</h1>
          <p className="text-sm text-gray-400 mt-1">Track dental laboratory work with visual teeth selection (FDI system)</p>
        </div>
        <button onClick={() => setFormRecord(null)} className="btn-primary text-sm">
          <Plus size={16} /> New Lab Work
        </button>
      </div>

      {/* Status summary */}
      {!loading && !error && records.length > 0 && (
        <StatusSummaryCards records={records} />
      )}

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={handleSearchChange}
        workType={workType}
        onWorkTypeChange={(v) => { setWorkType(v); setPage(1) }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1) }}
        fromDate={fromDate}
        onFromDateChange={(v) => { setFromDate(v); setPage(1) }}
        toDate={toDate}
        onToDateChange={(v) => { setToDate(v); setPage(1) }}
        onClear={clearFilters}
        hasFilters={hasFilters}
      />

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : records.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No records match your filters.' : 'No laboratory work found.'}
          description={hasFilters ? 'Try adjusting your filters.' : 'Create your first laboratory work record to get started.'}
          action={!hasFilters ? (
            <button onClick={() => setFormRecord(null)} className="btn-primary text-sm">
              <Plus size={16} /> New Lab Work
            </button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Laboratory work table">
              <thead>
                <tr className="border-b border-dark-500">
                  {['Patient', 'Work Type', 'Selected Teeth', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{r.patient_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge text-xs ${workTypeColors[r.work_type] || workTypeColors['Other']}`}>
                        {r.work_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.teeth.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {r.teeth.map((t) => (
                            <span key={t} title={`FDI: ${t}`} className="px-1.5 py-0.5 rounded bg-dark-500 text-gray-300 text-xs font-medium">
                              {FDI_LABEL[t] ?? t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">No teeth specified</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge text-xs ${statusColors[r.status] || statusColors['Pending']}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(r.work_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r.id)} className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors" aria-label={`Edit ${r.patient_name}`}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => { setDeleteId(r.id); setDeleteName(r.patient_name) }} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label={`Delete ${r.patient_name}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      {/* Modals */}
      {formRecord !== undefined && (
        <LabWorkFormModal record={formRecord} onClose={() => setFormRecord(undefined)} onSaved={load} />
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Laboratory Work"
        message={`Are you sure you want to delete the laboratory work for "${deleteName}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  )
}

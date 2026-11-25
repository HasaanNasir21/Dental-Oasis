import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search, Edit2, Trash2, X, Save, AlertCircle,
  Filter, ChevronDown, ChevronLeft, ChevronRight,
  ArrowLeft, Plus, DollarSign, CheckCircle, Clock,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { labWorkApi } from '../../services/labWorkApi'
import { laboratoryApi } from '../../services/laboratoryApi'
import type {
  LabWork, LabWorkListItem, PaginationMeta, LabWorkType, LabWorkStatus,
  Laboratory, WorkTypeSummaryItem, LabWorkTeethSummary, LaboratoryPaymentSummary,
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

// ---- FDI → readable label map (e.g. "15" → "UR5") ----
const FDI_LABEL: Record<string, string> = {}
;[...Array(8)].forEach((_, i) => {
  const pos = String(i + 1)
  FDI_LABEL[`1${pos}`] = `UR${pos}`
  FDI_LABEL[`2${pos}`] = `UL${pos}`
  FDI_LABEL[`3${pos}`] = `LL${pos}`
  FDI_LABEL[`4${pos}`] = `LR${pos}`
})

const statusColors: Record<string, string> = {
  'Pending':   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  'Completed': 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  'Delivered': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
}

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

const workTypeIcons: Record<string, string> = {
  'PFM': '🦷', '3D PFM': '🦷', 'Zirconia': '🦷', 'E-Max': '🦷',
  'Dentures': '🦷', 'Aligner': '🦷', 'Inlay': '🦷', 'CC Plate': '🦷', 'Other': '🦷',
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const todayStr = () => new Date().toISOString().split('T')[0]

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

// ─────────────────────────────────────────────────────────────
//  PAYMENT SUMMARY BANNER
// ─────────────────────────────────────────────────────────────
function PaymentSummaryBanner({ summary }: { summary: LaboratoryPaymentSummary }) {
  const pendingPct =
    summary.total_cost > 0
      ? Math.round((summary.total_pending / summary.total_cost) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Total cost */}
      <div className="card flex items-center gap-4 py-4">
        <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-300 flex-shrink-0">
          <DollarSign size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Cost</p>
          <p className="text-xl font-bold text-white leading-tight">
            {fmt(summary.total_cost)}
            <span className="text-xs font-normal text-gray-500 ml-1">JD</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{summary.work_count} orders</p>
        </div>
      </div>

      {/* Received */}
      <div className="card flex items-center gap-4 py-4">
        <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-300 flex-shrink-0">
          <CheckCircle size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Paid to Lab</p>
          <p className="text-xl font-bold text-white leading-tight">
            {fmt(summary.total_paid)}
            <span className="text-xs font-normal text-gray-500 ml-1">JD</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{summary.paid_work_count} fully paid</p>
        </div>
      </div>

      {/* Pending */}
      <div className="card flex items-center gap-4 py-4">
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${summary.total_pending > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-500/20 text-gray-400'}`}>
          <Clock size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Pending</p>
          <p className={`text-xl font-bold leading-tight ${summary.total_pending > 0 ? 'text-amber-300' : 'text-white'}`}>
            {fmt(summary.total_pending)}
            <span className="text-xs font-normal text-gray-500 ml-1">JD</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {pendingPct}% unpaid · {summary.unpaid_work_count} orders
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  LAB WORK FORM MODAL
// ─────────────────────────────────────────────────────────────
const labWorkSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required').max(255),
  work_type: z.string(),
  status: z.string(),
  work_date: z.string().min(1, 'Date is required'),
  notes: z.string().max(5000).optional().or(z.literal('')),
  cost: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), { message: 'Cost must be a positive number' }),
  amount_paid: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), { message: 'Amount paid must be a positive number' }),
})
type LabWorkFormValues = z.infer<typeof labWorkSchema>

function LabWorkFormModal({
  record,
  laboratoryId,
  onClose,
  onSaved,
}: {
  record: LabWork | null
  laboratoryId: number
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
      cost: record?.cost != null ? String(record.cost) : '',
      amount_paid: record?.amount_paid != null ? String(record.amount_paid) : '',
    },
  })

  const onSubmit = async (values: LabWorkFormValues) => {
    setServerError(null)
    try {
      const payload = {
        patient_name: values.patient_name,
        laboratory_id: laboratoryId,
        work_type: values.work_type as LabWorkType,
        teeth,
        status: values.status as LabWorkStatus,
        work_date: values.work_date,
        notes: values.notes || undefined,
        cost: values.cost ? Number(values.cost) : null,
        amount_paid: values.amount_paid ? Number(values.amount_paid) : null,
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

        {/* Cost + Amount Paid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="lw-cost">Cost (JD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">JD</span>
              <input
                id="lw-cost"
                type="number"
                min="0"
                step="0.01"
                className={`input pl-10 ${errors.cost ? 'border-red-500' : ''}`}
                placeholder="0.00"
                {...register('cost')}
              />
            </div>
            {errors.cost && <p className="field-error">{errors.cost.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="lw-paid">Amount Paid (JD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">JD</span>
              <input
                id="lw-paid"
                type="number"
                min="0"
                step="0.01"
                className={`input pl-10 ${errors.amount_paid ? 'border-red-500' : ''}`}
                placeholder="0.00"
                {...register('amount_paid')}
              />
            </div>
            {errors.amount_paid && <p className="field-error">{errors.amount_paid.message}</p>}
          </div>
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

// ─────────────────────────────────────────────────────────────
//  FILTER BAR
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
//  TREATMENT SUMMARY CARDS
// ─────────────────────────────────────────────────────────────
function TreatmentSummaryCards({
  summary,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
}: {
  summary: LabWorkTeethSummary | null
  year: number
  month: number
  onPrevMonth: () => void
  onNextMonth: () => void
  isCurrentMonth: boolean
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Treatment Summary</h2>
          <span className="text-xs text-gray-500">— total teeth per work type</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-dark-500 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-white min-w-[130px] text-center">
            {MONTH_NAMES[month - 1]} {year}
            {isCurrentMonth && (
              <span className="ml-1.5 text-xs font-normal text-primary-400">(current)</span>
            )}
          </span>
          <button
            onClick={onNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-dark-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {!summary || summary.summary.length === 0 ? (
        <div className="card py-6 text-center">
          <p className="text-sm text-gray-500">No lab work recorded for {MONTH_NAMES[month - 1]} {year}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {summary.summary.map(({ work_type, tooth_count, record_count }: WorkTypeSummaryItem) => (
            <div key={work_type} className="card flex items-center gap-3 py-3">
              <div className={`p-2 rounded-lg text-base flex items-center justify-center w-9 h-9 flex-shrink-0 ${workTypeColors[work_type] ?? workTypeColors['Other']}`}>
                {workTypeIcons[work_type] ?? '🦷'}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{work_type}</p>
                <p className="text-lg font-bold text-white leading-tight">
                  {tooth_count}
                  <span className="text-xs font-normal text-gray-500 ml-1">teeth</span>
                </p>
                <p className="text-xs text-gray-500">{record_count} {record_count === 1 ? 'patient' : 'patients'}</p>
              </div>
            </div>
          ))}
          <div className="card flex items-center gap-3 py-3 border border-primary-500/20">
            <div className="p-2 rounded-lg bg-primary-500/20 flex items-center justify-center w-9 h-9 flex-shrink-0 text-primary-300 text-base">
              🏥
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">Total</p>
              <p className="text-lg font-bold text-white leading-tight">
                {summary.total_teeth}
                <span className="text-xs font-normal text-gray-500 ml-1">teeth</span>
              </p>
              <p className="text-xs text-gray-500">{summary.total_records} {summary.total_records === 1 ? 'patient' : 'patients'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PAYMENT STATUS BADGE (per row)
// ─────────────────────────────────────────────────────────────
function PaymentBadge({ cost, amountPaid }: { cost: number | null; amountPaid: number | null }) {
  if (cost == null) return <span className="text-gray-600 text-xs">—</span>

  const paid = amountPaid ?? 0
  const pending = cost - paid

  if (pending <= 0) {
    return (
      <span className="badge text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30">
        Paid
      </span>
    )
  }
  if (paid > 0) {
    return (
      <span className="badge text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
        Partial
      </span>
    )
  }
  return (
    <span className="badge text-xs bg-red-500/20 text-red-300 border border-red-500/30">
      Unpaid
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function LaboratoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const laboratoryId = id ? parseInt(id, 10) : null

  // Laboratory info
  const [laboratory, setLaboratory] = useState<Laboratory | null>(null)
  const [labLoading, setLabLoading] = useState(true)
  const [labError, setLabError] = useState<string | null>(null)

  // Payment summary
  const [paymentSummary, setPaymentSummary] = useState<LaboratoryPaymentSummary | null>(null)

  // Lab work list
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

  // Treatment summary (teeth per work type)
  const [summary, setSummary] = useState<LabWorkTeethSummary | null>(null)
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear())
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1)

  // Modal states
  const [formRecord, setFormRecord] = useState<LabWork | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { showToast } = useToast()

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const isCurrentMonth = summaryMonth === currentMonth && summaryYear === currentYear

  // Load laboratory details
  useEffect(() => {
    if (!laboratoryId) {
      navigate('/admin/lab-work')
      return
    }

    setLabLoading(true)
    setLabError(null)
    laboratoryApi.getById(laboratoryId)
      .then((r) => setLaboratory(r.data))
      .catch((e) => setLabError(parseApiError(e)))
      .finally(() => setLabLoading(false))
  }, [laboratoryId, navigate])

  // Load payment summary
  const loadPaymentSummary = useCallback(() => {
    if (!laboratoryId) return
    laboratoryApi.paymentSummary(laboratoryId)
      .then((r) => setPaymentSummary(r.data))
      .catch((e) => console.error('Failed to load payment summary:', e))
  }, [laboratoryId])

  useEffect(() => { loadPaymentSummary() }, [loadPaymentSummary])

  // Load lab work list
  const loadRecords = useCallback(() => {
    if (!laboratoryId) return

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
      laboratory_id: laboratoryId,
    })
      .then((r) => { setRecords(r.data); setMeta(r.meta) })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [laboratoryId, page, search, workType, status, fromDate, toDate])

  useEffect(() => { loadRecords() }, [loadRecords])

  // Load teeth summary
  const loadSummary = useCallback(() => {
    if (!laboratoryId) return

    const firstDay = new Date(summaryYear, summaryMonth - 1, 1)
    const lastDay = new Date(summaryYear, summaryMonth, 0)
    const from = firstDay.toISOString().split('T')[0]
    const to = lastDay.toISOString().split('T')[0]

    labWorkApi.teethSummary({ laboratory_id: laboratoryId, from_date: from, to_date: to })
      .then((r) => setSummary(r.data))
      .catch((e) => console.error('Failed to load summary:', e))
  }, [laboratoryId, summaryYear, summaryMonth])

  useEffect(() => { loadSummary() }, [loadSummary])

  const handleSearchChange = (val: string) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1) }, 400)
  }

  const clearFilters = () => {
    setSearch(''); setWorkType(''); setStatus(''); setFromDate(''); setToDate(''); setPage(1)
  }

  const hasFilters = !!(workType || status || fromDate || toDate)

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await labWorkApi.delete(deleteId)
      showToast('Laboratory work deleted successfully.')
      setDeleteId(null)
      loadRecords()
      loadSummary()
      loadPaymentSummary()
    } catch (e) {
      showToast(parseApiError(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const openEdit = async (recordId: number) => {
    try {
      const res = await labWorkApi.getById(recordId)
      if (res.data) setFormRecord(res.data)
    } catch (e) {
      showToast(parseApiError(e), 'error')
    }
  }

  const onFormSaved = () => {
    setFormRecord(undefined)
    loadRecords()
    loadSummary()
    loadPaymentSummary()
  }

  const handlePrevMonth = () => {
    if (summaryMonth === 1) { setSummaryMonth(12); setSummaryYear(summaryYear - 1) }
    else setSummaryMonth(summaryMonth - 1)
  }

  const handleNextMonth = () => {
    if (isCurrentMonth) return
    if (summaryMonth === 12) { setSummaryMonth(1); setSummaryYear(summaryYear + 1) }
    else setSummaryMonth(summaryMonth + 1)
  }

  if (labLoading) return <div className="p-6"><PageLoader /></div>

  if (labError || !laboratory) {
    return (
      <div className="p-6">
        <ErrorState message={labError || 'Laboratory not found'} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/lab-work')}
            className="p-2 rounded text-gray-400 hover:text-white hover:bg-dark-500 transition-colors"
            aria-label="Back to all lab work"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{laboratory.name}</h1>
            <p className="text-sm text-gray-400">Laboratory work orders and payments</p>
          </div>
        </div>
        <button onClick={() => setFormRecord(null)} className="btn-primary">
          <Plus size={16} /> New Lab Work
        </button>
      </div>

      {/* Payment Summary */}
      {paymentSummary && <PaymentSummaryBanner summary={paymentSummary} />}

      {/* Treatment Summary */}
      <TreatmentSummaryCards
        summary={summary}
        year={summaryYear}
        month={summaryMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isCurrentMonth={isCurrentMonth}
      />

      {/* Filter Bar */}
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

      {/* Lab Work Table */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRecords} />
      ) : records.length === 0 ? (
        <EmptyState
          title={search || hasFilters ? 'No lab work matches your search.' : `No lab work for ${laboratory.name} yet.`}
          description={search || hasFilters ? 'Try adjusting your filters.' : 'Add your first lab work order for this laboratory.'}
          action={!search && !hasFilters ? (
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
                  {['Patient', 'Work Type', 'Teeth', 'Status', 'Cost', 'Paid', 'Payment', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const pending = r.cost != null ? r.cost - (r.amount_paid ?? 0) : null
                  return (
                    <tr key={r.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{r.patient_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge text-xs ${workTypeColors[r.work_type] ?? workTypeColors['Other']}`}>
                          {r.work_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {r.teeth && r.teeth.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {r.teeth.slice(0, 4).map((t: string) => (
                              <span key={t} className="badge text-xs bg-dark-500 text-gray-300">{FDI_LABEL[t] || t}</span>
                            ))}
                            {r.teeth.length > 4 && (
                              <span className="text-xs text-gray-500">+{r.teeth.length - 4}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge text-xs ${statusColors[r.status] ?? statusColors['Pending']}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap text-xs font-mono">
                        {r.cost != null ? `${fmt(r.cost)} JD` : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap text-xs font-mono">
                        {r.amount_paid != null ? `${fmt(r.amount_paid)} JD` : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.cost != null && pending != null && pending > 0 && (
                          <span className="text-xs text-amber-400 font-mono block">{fmt(pending)} JD left</span>
                        )}
                        <PaymentBadge cost={r.cost} amountPaid={r.amount_paid} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(r.work_date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(r.id)}
                            className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                            aria-label={`Edit ${r.patient_name}'s lab work`}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => { setDeleteId(r.id); setDeleteName(r.patient_name) }}
                            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label={`Delete ${r.patient_name}'s lab work`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      {/* Modals */}
      {formRecord !== undefined && laboratoryId && (
        <LabWorkFormModal
          record={formRecord}
          laboratoryId={laboratoryId}
          onClose={() => setFormRecord(undefined)}
          onSaved={onFormSaved}
        />
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Laboratory Work"
        message={`Are you sure you want to delete the lab work for "${deleteName}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  )
}

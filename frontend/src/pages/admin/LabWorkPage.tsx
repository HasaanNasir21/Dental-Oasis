import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search, Plus, Edit2, Trash2, X, Save, AlertCircle, FlaskConical,
  Filter, ChevronDown, Building2, Phone, Mail, MapPin, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { labWorkApi } from '../../services/labWorkApi'
import { laboratoryApi } from '../../services/laboratoryApi'
import type {
  LabWork, LabWorkListItem, PaginationMeta, LabWorkType, LabWorkStatus,
  Laboratory, LaboratoryListItem, LaboratoryOption,
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
  'Pending': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  'In Progress': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  'Completed': 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
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

const todayStr = () => new Date().toISOString().split('T')[0]

// ─────────────────────────────────────────────────────────────
//  LABORATORY FORM MODAL
// ─────────────────────────────────────────────────────────────
const labSchema = z.object({
  name: z.string().min(1, 'Laboratory name is required').max(255),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').max(255).optional().or(z.literal('')),
  address: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  is_active: z.boolean(),
})
type LabFormValues = z.infer<typeof labSchema>

function LaboratoryFormModal({
  record,
  onClose,
  onSaved,
}: {
  record: Laboratory | null
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { showToast } = useToast()
  const isEdit = !!record

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      name: record?.name ?? '',
      phone: record?.phone ?? '',
      email: record?.email ?? '',
      address: record?.address ?? '',
      notes: record?.notes ?? '',
      is_active: record?.is_active ?? true,
    },
  })

  const isActive = watch('is_active')

  const onSubmit = async (values: LabFormValues) => {
    setServerError(null)
    try {
      const payload = {
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
        is_active: values.is_active,
      }
      if (isEdit && record) {
        await laboratoryApi.update(record.id, payload)
        showToast('Laboratory updated successfully.')
      } else {
        await laboratoryApi.create(payload)
        showToast('Laboratory created successfully.')
      }
      onSaved()
      onClose()
    } catch (e) {
      setServerError(parseApiError(e))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Laboratory' : 'New Laboratory'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Name */}
        <div>
          <label className="label" htmlFor="lab-name">Laboratory Name <span className="text-red-400">*</span></label>
          <input
            id="lab-name"
            type="text"
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g. Alpha Dental Lab"
            {...register('name')}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="lab-phone">Phone</label>
            <input id="lab-phone" type="tel" className="input" placeholder="e.g. 03001234567" {...register('phone')} />
            {errors.phone && <p className="field-error">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="lab-email">Email</label>
            <input id="lab-email" type="email" className="input" placeholder="e.g. lab@example.com" {...register('email')} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label" htmlFor="lab-address">Address</label>
          <input id="lab-address" type="text" className="input" placeholder="Optional — street address" {...register('address')} />
          {errors.address && <p className="field-error">{errors.address.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="lab-notes">Notes</label>
          <textarea
            id="lab-notes"
            rows={3}
            className="input resize-none"
            placeholder="Optional — any notes about this laboratory"
            {...register('notes')}
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between p-3 bg-dark-600 rounded-lg">
          <div>
            <p className="text-sm font-medium text-white">Active</p>
            <p className="text-xs text-gray-500">Inactive laboratories won't appear in lab work forms</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('is_active', !isActive)}
            className="text-primary-400 hover:text-primary-300 transition-colors"
            aria-label={isActive ? 'Deactivate laboratory' : 'Activate laboratory'}
          >
            {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-500" />}
          </button>
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
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Laboratory' : 'Create Laboratory'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
//  LABORATORIES TAB
// ─────────────────────────────────────────────────────────────
function LaboratoriesTab({
  triggerNew,
  onNewConsumed,
}: {
  triggerNew: boolean
  onNewConsumed: () => void
}) {
  const [records, setRecords] = useState<LaboratoryListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formRecord, setFormRecord] = useState<Laboratory | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { showToast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    laboratoryApi.list({ page, page_size: 20, search: search || undefined })
      .then((r) => { setRecords(r.data); setMeta(r.meta) })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  // Open new-laboratory modal when parent requests it
  useEffect(() => {
    if (triggerNew) {
      setFormRecord(null)
      onNewConsumed()
    }
  }, [triggerNew, onNewConsumed])

  const handleSearchChange = (val: string) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1) }, 400)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await laboratoryApi.delete(deleteId)
      showToast('Laboratory deleted successfully.')
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
      const res = await laboratoryApi.getById(id)
      if (res.data) setFormRecord(res.data)
    } catch (e) {
      showToast(parseApiError(e), 'error')
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <input
            type="search"
            className="input pl-9 text-sm"
            placeholder="Search by name..."
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search laboratories"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : records.length === 0 ? (
        <EmptyState
          title={search ? 'No laboratories match your search.' : 'No laboratories yet.'}
          description={search ? 'Try a different name.' : 'Add your first laboratory to associate it with lab work orders.'}
          action={!search ? (
            <button onClick={() => setFormRecord(null)} className="btn-primary text-sm">
              <Plus size={16} /> New Laboratory
            </button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Laboratories table">
              <thead>
                <tr className="border-b border-dark-500">
                  {['Name', 'Phone', 'Email', 'Address', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-primary-400 flex-shrink-0" />
                        {r.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {r.phone ? (
                        <span className="flex items-center gap-1"><Phone size={12} /> {r.phone}</span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {r.email ? (
                        <span className="flex items-center gap-1"><Mail size={12} /> {r.email}</span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                      {r.address ? (
                        <span className="flex items-center gap-1"><MapPin size={12} className="flex-shrink-0" /> {r.address}</span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge text-xs ${r.is_active
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(r.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                          aria-label={`Edit ${r.name}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => { setDeleteId(r.id); setDeleteName(r.name) }}
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label={`Delete ${r.name}`}
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
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      {/* Modals */}
      {formRecord !== undefined && (
        <LaboratoryFormModal record={formRecord} onClose={() => setFormRecord(undefined)} onSaved={load} />
      )}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Laboratory"
        message={`Are you sure you want to delete "${deleteName}"? Existing lab work orders linked to this laboratory will be unlinked but not deleted.`}
        isLoading={deleting}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  LAB WORK FORM MODAL
// ─────────────────────────────────────────────────────────────
const labWorkSchema = z.object({
  patient_name: z.string().min(1, 'Patient name is required').max(255),
  laboratory_id: z.number().nullable().optional(),
  work_type: z.string(),
  status: z.string(),
  work_date: z.string().min(1, 'Date is required'),
  notes: z.string().max(5000).optional().or(z.literal('')),
})
type LabWorkFormValues = z.infer<typeof labWorkSchema>

function LabWorkFormModal({
  record,
  labOptions,
  onClose,
  onSaved,
}: {
  record: LabWork | null
  labOptions: LaboratoryOption[]
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
      laboratory_id: record?.laboratory_id ?? null,
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
        laboratory_id: values.laboratory_id ?? null,
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

        {/* Laboratory */}
        <div>
          <label className="label" htmlFor="lw-lab">Laboratory</label>
          <select
            id="lw-lab"
            className="input"
            {...register('laboratory_id', {
              setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
            })}
          >
            <option value="">— No laboratory —</option>
            {labOptions.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          {labOptions.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No active laboratories. Add one in the Laboratories tab first.</p>
          )}
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

// ─────────────────────────────────────────────────────────────
//  FILTER BAR
// ─────────────────────────────────────────────────────────────
function FilterBar({
  search, onSearchChange,
  workType, onWorkTypeChange,
  status, onStatusChange,
  fromDate, onFromDateChange,
  toDate, onToDateChange,
  laboratoryId, onLaboratoryIdChange,
  labOptions,
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
  laboratoryId: string
  onLaboratoryIdChange: (v: string) => void
  labOptions: LaboratoryOption[]
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-dark-500">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Laboratory</label>
            <select className="input text-sm" value={laboratoryId} onChange={(e) => onLaboratoryIdChange(e.target.value)}>
              <option value="">All laboratories</option>
              {labOptions.map((l) => (
                <option key={l.id} value={String(l.id)}>{l.name}</option>
              ))}
            </select>
          </div>
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
//  STATUS SUMMARY CARDS
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
//  LAB WORK TAB
// ─────────────────────────────────────────────────────────────
function LabWorkTab({
  labOptions,
  triggerNew,
  onNewConsumed,
}: {
  labOptions: LaboratoryOption[]
  triggerNew: boolean
  onNewConsumed: () => void
}) {
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
  const [laboratoryId, setLaboratoryId] = useState('')
  const [page, setPage] = useState(1)

  // Modals
  const [formRecord, setFormRecord] = useState<LabWork | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { showToast } = useToast()

  const hasFilters = !!(search || workType || status || fromDate || toDate || laboratoryId)

  // Open new-record modal when parent requests it
  useEffect(() => {
    if (triggerNew) {
      setFormRecord(null)
      onNewConsumed()
    }
  }, [triggerNew, onNewConsumed])

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
      laboratory_id: laboratoryId ? Number(laboratoryId) : undefined,
    })
      .then((r) => { setRecords(r.data); setMeta(r.meta) })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [page, search, workType, status, fromDate, toDate, laboratoryId])

  useEffect(() => { load() }, [load])

  const handleSearchChange = (val: string) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1) }, 400)
  }

  const clearFilters = () => {
    setSearch('')
    setWorkType('')
    setStatus('')
    setFromDate('')
    setToDate('')
    setLaboratoryId('')
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
    <div>
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
        laboratoryId={laboratoryId}
        onLaboratoryIdChange={(v) => { setLaboratoryId(v); setPage(1) }}
        labOptions={labOptions}
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
                  {['Patient', 'Laboratory', 'Work Type', 'Selected Teeth', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{r.patient_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.laboratory_name ? (
                        <span className="flex items-center gap-1 text-xs text-primary-300">
                          <Building2 size={12} className="flex-shrink-0" />
                          {r.laboratory_name}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
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
        <LabWorkFormModal
          record={formRecord}
          labOptions={labOptions}
          onClose={() => setFormRecord(undefined)}
          onSaved={load}
        />
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

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
type Tab = 'lab-work' | 'laboratories'

export default function LabWorkPage() {
  const [activeTab, setActiveTab] = useState<Tab>('lab-work')
  const [labOptions, setLabOptions] = useState<LaboratoryOption[]>([])
  const [triggerNewLabWork, setTriggerNewLabWork] = useState(false)
  const [triggerNewLaboratory, setTriggerNewLaboratory] = useState(false)

  // Load lab options once — used by both the form dropdown and the filter bar
  const loadLabOptions = useCallback(() => {
    laboratoryApi.options()
      .then((res) => setLabOptions(res.data ?? []))
      .catch(() => setLabOptions([]))
  }, [])

  useEffect(() => {
    document.title = 'Laboratory Work | Dental Oasis Admin'
    loadLabOptions()
  }, [loadLabOptions])

  // Reload options when switching away from Laboratories tab (user may have added/edited labs)
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'lab-work') loadLabOptions()
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Laboratory Work</h1>
          <p className="text-sm text-gray-400 mt-1">Manage laboratories and track dental lab work orders</p>
        </div>
        {activeTab === 'lab-work' && (
          <button onClick={() => setTriggerNewLabWork(true)} className="btn-primary text-sm">
            <Plus size={16} /> New Lab Work
          </button>
        )}
        {activeTab === 'laboratories' && (
          <button onClick={() => setTriggerNewLaboratory(true)} className="btn-primary text-sm">
            <Plus size={16} /> New Laboratory
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-500">
        <button
          onClick={() => handleTabChange('lab-work')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'lab-work'
              ? 'border-primary-400 text-primary-300'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FlaskConical size={15} />
          Lab Work Orders
        </button>
        <button
          onClick={() => handleTabChange('laboratories')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'laboratories'
              ? 'border-primary-400 text-primary-300'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Building2 size={15} />
          Laboratories
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'lab-work' && (
        <LabWorkTab
          labOptions={labOptions}
          triggerNew={triggerNewLabWork}
          onNewConsumed={() => setTriggerNewLabWork(false)}
        />
      )}
      {activeTab === 'laboratories' && (
        <LaboratoriesTab
          triggerNew={triggerNewLaboratory}
          onNewConsumed={() => setTriggerNewLaboratory(false)}
        />
      )}
    </div>
  )
}

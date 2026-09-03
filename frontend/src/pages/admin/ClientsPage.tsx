import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Edit2, Trash2, X, Save, AlertCircle, Phone, MapPin, FileText } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clientApi } from '../../services/clientApi'
import type { Client, ClientListItem, PaginationMeta } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import { parseApiError, formatDate } from '../../utils/errorHandler'
import { useToast } from '../../context/ToastContext'

// ---- Schemas ----
const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  contact_number: z.string().min(7, 'Enter a valid contact number').max(20),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
})
type ClientFormValues = z.infer<typeof clientSchema>

// ---- Client Form Modal ----
function ClientFormModal({
  client,
  onClose,
  onSaved,
}: {
  client: Client | null
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { showToast } = useToast()
  const isEdit = !!client

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? '',
      contact_number: client?.contact_number ?? '',
      address: client?.address ?? '',
      notes: client?.notes ?? '',
    },
  })

  const onSubmit = async (values: ClientFormValues) => {
    setServerError(null)
    try {
      if (isEdit && client) {
        await clientApi.update(client.id, values)
        showToast('Client updated successfully.')
      } else {
        await clientApi.create(values)
        showToast('Client created successfully.')
      }
      onSaved()
      onClose()
    } catch (e) {
      setServerError(parseApiError(e))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Client' : 'Add New Client'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label className="label" htmlFor="client-name">Full Name <span className="text-red-400">*</span></label>
          <input
            id="client-name"
            type="text"
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g. Muhammad Ali"
            {...register('name')}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        {/* Contact */}
        <div>
          <label className="label" htmlFor="client-contact">Contact Number <span className="text-red-400">*</span></label>
          <input
            id="client-contact"
            type="tel"
            className={`input ${errors.contact_number ? 'border-red-500' : ''}`}
            placeholder="e.g. 03001234567"
            {...register('contact_number')}
          />
          {errors.contact_number && <p className="field-error">{errors.contact_number.message}</p>}
        </div>

        {/* Address */}
        <div>
          <label className="label" htmlFor="client-address">Address</label>
          <input
            id="client-address"
            type="text"
            className="input"
            placeholder="Optional"
            {...register('address')}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="client-notes">Notes</label>
          <textarea
            id="client-notes"
            rows={3}
            className="input resize-none"
            placeholder="Optional internal notes"
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
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
            {isSubmitting ? <LoadingSpinner size="sm" /> : <Save size={14} />}
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Client' : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---- Client Detail Modal ----
function ClientDetailModal({
  clientId,
  onClose,
  onEdit,
}: {
  clientId: number
  onClose: () => void
  onEdit: (client: Client) => void
}) {
  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      clientApi.getById(clientId),
      clientApi.getAppointments(clientId),
    ])
      .then(([clientRes, apptsRes]) => {
        if (clientRes.success && clientRes.data) setClient(clientRes.data)
        if (apptsRes.success && apptsRes.data) setAppointments(apptsRes.data as any[])
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [clientId])

  return (
    <Modal isOpen onClose={onClose} title="Client Details" size="lg">
      {loading ? (
        <PageLoader />
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : client ? (
        <div className="space-y-6">
          {/* Client info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
              <p className="text-white font-medium">{client.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Contact Number</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{client.contact_number}</p>
                <a
                  href={`tel:${client.contact_number}`}
                  className="p-1 rounded text-gray-500 hover:text-green-400 transition-colors"
                  aria-label={`Call ${client.name}`}
                >
                  <Phone size={14} />
                </a>
              </div>
            </div>
            {client.address && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Address</p>
                <p className="text-gray-300 text-sm flex items-start gap-1.5">
                  <MapPin size={13} className="text-gray-500 mt-0.5 flex-shrink-0" />
                  {client.address}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Added</p>
              <p className="text-gray-300 text-sm">{formatDate(client.created_at)}</p>
            </div>
            {client.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Notes</p>
                <p className="text-gray-300 text-sm bg-dark-600 rounded-lg p-3">{client.notes}</p>
              </div>
            )}
          </div>

          <hr className="border-dark-500" />

          {/* Appointment history */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText size={14} className="text-primary-400" />
              Appointment History ({appointments.length})
            </h3>
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No appointments on record for this client.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {appointments.map((appt: any) => (
                  <li key={appt.id} className="flex items-center justify-between gap-4 py-2.5 px-3 bg-dark-600 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-white">{appt.reason}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {appt.appointment_date ? formatDate(appt.appointment_date) : formatDate(appt.created_at)}
                        {appt.notes && <span className="ml-2 text-gray-500">· {appt.notes.slice(0, 40)}{appt.notes.length > 40 ? '…' : ''}</span>}
                      </p>
                    </div>
                    <span className={`badge text-xs ${
                      appt.status === 'COMPLETED' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                      appt.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      appt.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost text-sm">Close</button>
            <button onClick={() => { onEdit(client); onClose() }} className="btn-primary text-sm">
              <Edit2 size={14} /> Edit Client
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

// ---- Main Page ----
export default function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [formClient, setFormClient] = useState<Client | null | undefined>(undefined) // undefined = closed, null = new
  const [viewId, setViewId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { showToast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    clientApi.list({ page, page_size: 20, search: search || undefined })
      .then((r) => {
        setClients(r.data)
        setMeta(r.meta)
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => {
    document.title = 'Clients | Dental Oasis Admin'
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

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await clientApi.delete(deleteId)
      showToast('Client deleted successfully.')
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
      const res = await clientApi.getById(id)
      if (res.success && res.data) setFormClient(res.data)
    } catch (e) {
      showToast(parseApiError(e), 'error')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-gray-400 mt-1">Manage patient records and appointment history</p>
        </div>
        <button onClick={() => setFormClient(null)} className="btn-primary text-sm">
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
            <input
              type="search"
              className="input pl-9 text-sm"
              placeholder="Search by name or contact number..."
              defaultValue={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search clients"
            />
          </div>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="btn-ghost text-sm">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : clients.length === 0 ? (
        <EmptyState
          title={search ? 'No clients match your search.' : 'No clients found.'}
          description={search ? 'Try a different name or contact number.' : 'Add your first client to get started.'}
          action={!search ? (
            <button onClick={() => setFormClient(null)} className="btn-primary text-sm">
              <Plus size={16} /> Add Client
            </button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Clients table">
              <thead>
                <tr className="border-b border-dark-500">
                  {['Name', 'Contact', 'Address', 'Added', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{client.name}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{client.contact_number}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">
                      {client.address || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(client.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/clients/${client.id}`)}
                          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-dark-500 transition-colors"
                          aria-label={`View ${client.name}`}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(client.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                          aria-label={`Edit ${client.name}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => { setDeleteId(client.id); setDeleteName(client.name) }}
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label={`Delete ${client.name}`}
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

      {/* View Detail Modal */}
      {viewId && (
        <ClientDetailModal
          clientId={viewId}
          onClose={() => setViewId(null)}
          onEdit={(client) => setFormClient(client)}
        />
      )}

      {/* Add / Edit Form Modal */}
      {formClient !== undefined && (
        <ClientFormModal
          client={formClient}
          onClose={() => setFormClient(undefined)}
          onSaved={load}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteName}"? This will permanently remove their record. This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  )
}

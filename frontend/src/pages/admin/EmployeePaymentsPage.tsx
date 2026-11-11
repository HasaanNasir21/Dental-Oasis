import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search, Plus, Edit2, Trash2, X, Save, AlertCircle, Wallet,
  TrendingUp, Users, DollarSign,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { employeeApi } from '../../services/employeeApi'
import type {
  Employee, EmployeeListItem, EmployeeOption, PaginationMeta,
  EmployeePayment, EmployeePaymentListItem, PaymentSummary,
} from '../../types'
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
const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  contact_number: z.string().max(20).optional().or(z.literal('')),
  role: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})
type EmployeeFormValues = z.infer<typeof employeeSchema>

const paymentSchema = z.object({
  employee_id: z.number().min(1, 'Select an employee'),
  amount: z.number().positive('Amount must be greater than zero'),
  payment_date: z.string().min(1, 'Date is required'),
  notes: z.string().max(5000).optional().or(z.literal('')),
})
type PaymentFormValues = z.infer<typeof paymentSchema>

const todayStr = () => new Date().toISOString().split('T')[0]

// ---- Employee Form Modal ----
function EmployeeFormModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | null
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { showToast } = useToast()
  const isEdit = !!employee

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? '',
      contact_number: employee?.contact_number ?? '',
      role: employee?.role ?? '',
      notes: employee?.notes ?? '',
      is_active: employee?.is_active ?? true,
    },
  })

  const onSubmit = async (values: EmployeeFormValues) => {
    setServerError(null)
    try {
      const payload = {
        ...values,
        contact_number: values.contact_number || undefined,
        role: values.role || undefined,
        notes: values.notes || undefined,
      }
      if (isEdit && employee) {
        await employeeApi.update(employee.id, payload)
        showToast('Employee updated successfully.')
      } else {
        await employeeApi.create(payload)
        showToast('Employee added successfully.')
      }
      onSaved()
      onClose()
    } catch (e) {
      setServerError(parseApiError(e))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Employee' : 'Add New Employee'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="emp-name">Full Name <span className="text-red-400">*</span></label>
          <input id="emp-name" type="text" className={`input ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g. Ali" {...register('name')} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="emp-contact">Contact Number</label>
          <input id="emp-contact" type="tel" className="input" placeholder="Optional" {...register('contact_number')} />
        </div>
        <div>
          <label className="label" htmlFor="emp-role">Role / Position</label>
          <input id="emp-role" type="text" className="input" placeholder="e.g. Dental Assistant" {...register('role')} />
        </div>
        <div>
          <label className="label" htmlFor="emp-notes">Notes</label>
          <textarea id="emp-notes" rows={3} className="input resize-none" placeholder="Optional" {...register('notes')} />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" {...register('is_active')} />
            <span className="text-sm text-gray-300">Active employee</span>
          </label>
        )}
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
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---- Payment Form Modal ----
function PaymentFormModal({
  payment,
  employees,
  defaultEmployeeId,
  onClose,
  onSaved,
}: {
  payment: EmployeePayment | null
  employees: EmployeeOption[]
  defaultEmployeeId?: number
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { showToast } = useToast()
  const isEdit = !!payment

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      employee_id: payment?.employee_id ?? defaultEmployeeId ?? 0,
      amount: payment?.amount ?? 0,
      payment_date: payment?.payment_date ?? todayStr(),
      notes: payment?.notes ?? '',
    },
  })
  const setQuickDate = (daysAgo: number) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    setValue('payment_date', d.toISOString().split('T')[0])
  }

  const onSubmit = async (values: PaymentFormValues) => {
    setServerError(null)
    try {
      const payload = {
        employee_id: values.employee_id,
        amount: values.amount,
        payment_date: values.payment_date,
        notes: values.notes || undefined,
      }
      if (isEdit && payment) {
        await employeeApi.updatePayment(payment.id, payload)
        showToast('Payment updated successfully.')
      } else {
        await employeeApi.createPayment(payload)
        showToast('Payment recorded successfully.')
      }
      onSaved()
      onClose()
    } catch (e) {
      setServerError(parseApiError(e))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Payment' : 'Record New Payment'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Employee select */}
        <div>
          <label className="label" htmlFor="pay-emp">Employee <span className="text-red-400">*</span></label>
          <select
            id="pay-emp"
            className={`input ${errors.employee_id ? 'border-red-500' : ''}`}
            {...register('employee_id', { valueAsNumber: true })}
          >
            <option value={0}>Select an employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}{emp.role ? ` — ${emp.role}` : ''}
              </option>
            ))}
          </select>
          {errors.employee_id && <p className="field-error">{errors.employee_id.message}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="label" htmlFor="pay-amount">Payment Amount (Rs.) <span className="text-red-400">*</span></label>
          <input
            id="pay-amount"
            type="number"
            step="0.01"
            min="0"
            className={`input ${errors.amount ? 'border-red-500' : ''}`}
            placeholder="e.g. 1500"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="field-error">{errors.amount.message}</p>}
          <p className="text-xs text-gray-500 mt-1">Amount can vary from day to day — enter any value.</p>
        </div>

        {/* Date */}
        <div>
          <label className="label" htmlFor="pay-date">Payment Date <span className="text-red-400">*</span></label>
          <input
            id="pay-date"
            type="date"
            max={todayStr()}
            className={`input ${errors.payment_date ? 'border-red-500' : ''}`}
            {...register('payment_date')}
          />
          {errors.payment_date && <p className="field-error">{errors.payment_date.message}</p>}
          {/* Quick date buttons */}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setQuickDate(0)} className="px-2.5 py-1 text-xs rounded-md bg-dark-500 text-gray-300 hover:bg-dark-400 transition-colors">
              Today
            </button>
            <button type="button" onClick={() => setQuickDate(1)} className="px-2.5 py-1 text-xs rounded-md bg-dark-500 text-gray-300 hover:bg-dark-400 transition-colors">
              Yesterday
            </button>
            <button type="button" onClick={() => setQuickDate(2)} className="px-2.5 py-1 text-xs rounded-md bg-dark-500 text-gray-300 hover:bg-dark-400 transition-colors">
              2 days ago
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Select any date — today, yesterday, or any previous date.</p>
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="pay-notes">Notes</label>
          <textarea id="pay-notes" rows={2} className="input resize-none" placeholder="Optional" {...register('notes')} />
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
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Payment' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---- Summary Cards ----
function SummaryCards({ summary, loading }: { summary: PaymentSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse h-24" />
        ))}
      </div>
    )
  }

  if (!summary) return null

  const cards = [
    { label: 'Total Paid', value: `Rs. ${summary.total_amount.toLocaleString('en-PK')}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Total Payments', value: summary.total_count.toString(), icon: TrendingUp, color: 'text-primary-400' },
    { label: 'Employees Paid', value: summary.employee_count.toString(), icon: Users, color: 'text-purple-400' },
    { label: 'Avg per Payment', value: `Rs. ${(summary.total_count > 0 ? summary.total_amount / summary.total_count : 0).toFixed(0)}`, icon: Wallet, color: 'text-amber-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card flex items-center gap-3">
          <div className="p-2.5 bg-dark-600 rounded-lg">
            <Icon size={18} className={color} />
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

// ---- Summary Breakdown ----
function SummaryBreakdown({ summary }: { summary: PaymentSummary | null }) {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'employee'>('daily')

  if (!summary || summary.total_count === 0) return null

  const tabs = [
    { key: 'daily' as const, label: 'Daily', count: summary.daily_totals.length },
    { key: 'weekly' as const, label: 'Weekly', count: summary.weekly_totals.length },
    { key: 'monthly' as const, label: 'Monthly', count: summary.monthly_totals.length },
    { key: 'employee' as const, label: 'By Employee', count: summary.employee_totals.length },
  ]

  return (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-dark-600 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="max-h-[280px] overflow-y-auto">
        {activeTab === 'daily' && (
          <div className="space-y-1.5">
            {summary.daily_totals.map((d) => (
              <div key={d.date} className="flex items-center justify-between py-2 px-3 bg-dark-600 rounded-lg text-sm">
                <span className="text-gray-300">{formatDate(d.date)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{d.count} payment{d.count !== 1 ? 's' : ''}</span>
                  <span className="font-semibold text-green-400">Rs. {d.total.toLocaleString('en-PK')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-1.5">
            {summary.weekly_totals.map((w) => (
              <div key={w.week_start} className="flex items-center justify-between py-2 px-3 bg-dark-600 rounded-lg text-sm">
                <span className="text-gray-300">Week of {formatDate(w.week_start)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{w.count} payment{w.count !== 1 ? 's' : ''}</span>
                  <span className="font-semibold text-green-400">Rs. {w.total.toLocaleString('en-PK')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="space-y-1.5">
            {summary.monthly_totals.map((m) => (
              <div key={`${m.year}-${m.month}`} className="flex items-center justify-between py-2 px-3 bg-dark-600 rounded-lg text-sm">
                <span className="text-gray-300">
                  {new Date(m.year, m.month - 1).toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{m.count} payment{m.count !== 1 ? 's' : ''}</span>
                  <span className="font-semibold text-green-400">Rs. {m.total.toLocaleString('en-PK')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'employee' && (
          <div className="space-y-1.5">
            {summary.employee_totals.map((e) => (
              <div key={e.employee_id} className="flex items-center justify-between py-2 px-3 bg-dark-600 rounded-lg text-sm">
                <span className="text-gray-300">{e.employee_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{e.count} payment{e.count !== 1 ? 's' : ''}</span>
                  <span className="font-semibold text-green-400">Rs. {e.total.toLocaleString('en-PK')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Main Page ----
export default function EmployeePaymentsPage() {
  const [activeView, setActiveView] = useState<'payments' | 'employees'>('payments')

  // Payment list state
  const [payments, setPayments] = useState<EmployeePaymentListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Employee list state
  const [employees, setEmployees] = useState<EmployeeListItem[]>([])
  const [empMeta, setEmpMeta] = useState<PaginationMeta | null>(null)
  const [empLoading, setEmpLoading] = useState(true)
  const [empError, setEmpError] = useState<string | null>(null)

  // Filters
  const [empSearch, setEmpSearch] = useState('')
  const [filterEmpId, setFilterEmpId] = useState<number | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [empPage, setEmpPage] = useState(1)

  // Summary
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Employee options for dropdown
  const [empOptions, setEmpOptions] = useState<EmployeeOption[]>([])

  // Modals
  const [formEmployee, setFormEmployee] = useState<Employee | null | undefined>(undefined)
  const [formPayment, setFormPayment] = useState<EmployeePayment | null | undefined>(undefined)
  const [defaultEmpId, setDefaultEmpId] = useState<number | undefined>(undefined)
  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null)
  const [deleteEmpId, setDeleteEmpId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const empSearchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { showToast } = useToast()

  // Load payments
  const loadPayments = useCallback(() => {
    setLoading(true)
    setError(null)
    employeeApi.listPayments({
      page,
      page_size: 20,
      employee_id: filterEmpId || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    })
      .then((r) => { setPayments(r.data); setMeta(r.meta) })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [page, filterEmpId, fromDate, toDate])

  // Load employees
  const loadEmployees = useCallback(() => {
    setEmpLoading(true)
    setEmpError(null)
    employeeApi.list({ page: empPage, page_size: 50, search: empSearch || undefined })
      .then((r) => { setEmployees(r.data); setEmpMeta(r.meta) })
      .catch((e) => setEmpError(parseApiError(e)))
      .finally(() => setEmpLoading(false))
  }, [empPage, empSearch])

  // Load summary
  const loadSummary = useCallback(() => {
    setSummaryLoading(true)
    employeeApi.getPaymentSummary({
      employee_id: filterEmpId || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    })
      .then((r) => { if (r.data) setSummary(r.data) })
      .catch(() => {})
      .finally(() => setSummaryLoading(false))
  }, [filterEmpId, fromDate, toDate])

  // Load employee options
  useEffect(() => {
    employeeApi.listAll()
      .then((r) => { if (r.data) setEmpOptions(r.data) })
      .catch(() => {})
  }, [empLoading])

  useEffect(() => { document.title = 'Employee Payments | Dental Oasis Admin' }, [])

  useEffect(() => { loadPayments() }, [loadPayments])
  useEffect(() => { loadEmployees() }, [loadEmployees])
  useEffect(() => { loadSummary() }, [loadSummary])

  const handleEmpSearchChange = (val: string) => {
    clearTimeout(empSearchTimer.current)
    empSearchTimer.current = setTimeout(() => {
      setEmpSearch(val)
      setEmpPage(1)
    }, 400)
  }

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return
    setDeleting(true)
    try {
      await employeeApi.deletePayment(deletePaymentId)
      showToast('Payment deleted successfully.')
      setDeletePaymentId(null)
      loadPayments()
      loadSummary()
    } catch (e) {
      showToast(parseApiError(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!deleteEmpId) return
    setDeleting(true)
    try {
      await employeeApi.delete(deleteEmpId)
      showToast('Employee deleted successfully.')
      setDeleteEmpId(null)
      loadEmployees()
      loadSummary()
    } catch (e) {
      showToast(parseApiError(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const openEditEmployee = async (id: number) => {
    try {
      const res = await employeeApi.getById(id)
      if (res.data) setFormEmployee(res.data)
    } catch (e) {
      showToast(parseApiError(e), 'error')
    }
  }

  const openEditPayment = async (id: number) => {
    try {
      const res = await employeeApi.getPaymentById(id)
      if (res.data) setFormPayment(res.data)
    } catch (e) {
      showToast(parseApiError(e), 'error')
    }
  }

  const clearFilters = () => {
    setFilterEmpId('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Payments</h1>
          <p className="text-sm text-gray-400 mt-1">Track daily payments to employees with full date-wise history</p>
        </div>
        <div className="flex gap-2">
          {activeView === 'payments' && (
            <button onClick={() => { setFormPayment(null); setDefaultEmpId(undefined) }} className="btn-primary text-sm">
              <Plus size={16} /> Record Payment
            </button>
          )}
          {activeView === 'employees' && (
            <button onClick={() => setFormEmployee(null)} className="btn-primary text-sm">
              <Plus size={16} /> Add Employee
            </button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView('payments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'payments' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          <Wallet size={15} className="inline mr-1.5" /> Payment History
        </button>
        <button
          onClick={() => setActiveView('employees')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'employees' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          <Users size={15} className="inline mr-1.5" /> Employees
        </button>
      </div>

      {/* ===== PAYMENTS VIEW ===== */}
      {activeView === 'payments' && (
        <>
          {/* Summary cards */}
          <SummaryCards summary={summary} loading={summaryLoading} />

          {/* Summary breakdown */}
          <SummaryBreakdown summary={summary} />

          {/* Filters */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Employee</label>
                <select
                  className="input text-sm"
                  value={filterEmpId}
                  onChange={(e) => { setFilterEmpId(e.target.value ? Number(e.target.value) : ''); setPage(1) }}
                >
                  <option value="">All employees</option>
                  {empOptions.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <input type="date" className="input text-sm" value={fromDate} max={toDate || todayStr()} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <input type="date" className="input text-sm" value={toDate} min={fromDate || undefined} max={todayStr()} onChange={(e) => { setToDate(e.target.value); setPage(1) }} />
              </div>
              <div className="flex items-end">
                {(filterEmpId || fromDate || toDate) ? (
                  <button onClick={clearFilters} className="btn-ghost text-sm w-full">
                    <X size={14} /> Clear Filters
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Payments table */}
          {loading ? (
            <PageLoader />
          ) : error ? (
            <ErrorState message={error} onRetry={loadPayments} />
          ) : payments.length === 0 ? (
            <EmptyState
              title="No payments found."
              description="Record a payment to get started, or adjust your filters."
              action={
                <button onClick={() => { setFormPayment(null); setDefaultEmpId(undefined) }} className="btn-primary text-sm">
                  <Plus size={16} /> Record Payment
                </button>
              }
            />
          ) : (
            <>
              <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Employee payments table">
                  <thead>
                    <tr className="border-b border-dark-500">
                      {['Date', 'Employee', 'Amount', 'Notes', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{p.employee_name}</td>
                        <td className="px-4 py-3 font-semibold text-green-400 whitespace-nowrap">Rs. {p.amount.toLocaleString('en-PK')}</td>
                        <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">{p.notes || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditPayment(p.id)} className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors" aria-label={`Edit payment ${p.id}`}>
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => setDeletePaymentId(p.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label={`Delete payment ${p.id}`}>
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
        </>
      )}

      {/* ===== EMPLOYEES VIEW ===== */}
      {activeView === 'employees' && (
        <>
          {/* Search */}
          <div className="card mb-6">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input type="search" className="input pl-9 text-sm" placeholder="Search by name, role, or contact..." defaultValue={empSearch} onChange={(e) => handleEmpSearchChange(e.target.value)} aria-label="Search employees" />
              </div>
              {empSearch && (
                <button onClick={() => { setEmpSearch(''); setEmpPage(1) }} className="btn-ghost text-sm">
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>

          {empLoading ? (
            <PageLoader />
          ) : empError ? (
            <ErrorState message={empError} onRetry={loadEmployees} />
          ) : employees.length === 0 ? (
            <EmptyState
              title={empSearch ? 'No employees match your search.' : 'No employees found.'}
              description={empSearch ? 'Try a different search.' : 'Add your first employee to get started.'}
              action={!empSearch ? (
                <button onClick={() => setFormEmployee(null)} className="btn-primary text-sm">
                  <Plus size={16} /> Add Employee
                </button>
              ) : undefined}
            />
          ) : (
            <>
              <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm" aria-label="Employees table">
                  <thead>
                    <tr className="border-b border-dark-500">
                      {['Name', 'Role', 'Contact', 'Total Paid', 'Payments', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-b border-dark-600 hover:bg-dark-600/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                          {emp.name}
                          {!emp.is_active && <span className="ml-2 text-xs text-gray-500">(inactive)</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{emp.role || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{emp.contact_number || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-green-400 whitespace-nowrap">Rs. {emp.total_paid.toLocaleString('en-PK')}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{emp.payment_count}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setFormPayment(null); setDefaultEmpId(emp.id) }} className="p-1.5 rounded text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors" aria-label={`Record payment for ${emp.name}`} title="Record Payment">
                              <Plus size={15} />
                            </button>
                            <button onClick={() => openEditEmployee(emp.id)} className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors" aria-label={`Edit ${emp.name}`}>
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => setDeleteEmpId(emp.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label={`Delete ${emp.name}`}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {empMeta && <Pagination meta={empMeta} onPageChange={setEmpPage} />}
            </>
          )}
        </>
      )}

      {/* Modals */}
      {formEmployee !== undefined && (
        <EmployeeFormModal employee={formEmployee} onClose={() => setFormEmployee(undefined)} onSaved={() => { loadEmployees(); loadSummary() }} />
      )}
      {formPayment !== undefined && (
        <PaymentFormModal payment={formPayment} employees={empOptions} defaultEmployeeId={defaultEmpId} onClose={() => { setFormPayment(undefined); setDefaultEmpId(undefined) }} onSaved={() => { loadPayments(); loadSummary(); loadEmployees() }} />
      )}
      <ConfirmModal isOpen={!!deletePaymentId} onClose={() => setDeletePaymentId(null)} onConfirm={handleDeletePayment} title="Delete Payment" message="Are you sure you want to delete this payment record? This action cannot be undone." isLoading={deleting} />
      <ConfirmModal isOpen={!!deleteEmpId} onClose={() => setDeleteEmpId(null)} onConfirm={handleDeleteEmployee} title="Delete Employee" message="Are you sure you want to delete this employee? All their payment records will also be permanently removed. This action cannot be undone." isLoading={deleting} />
    </div>
  )
}

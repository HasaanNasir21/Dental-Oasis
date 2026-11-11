// ---- API Response types ----

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T | null
  token?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ---- Appointment File ----

export interface AppointmentFile {
  id: number
  appointment_id: number
  file_url: string
  /** "image" or "pdf" */
  file_type: 'image' | 'pdf'
  file_name: string
  uploaded_at: string
}

// ---- Appointment ----

export type AppointmentStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type AppointmentReason =
  | 'Checkup'
  | 'Implant'
  | 'Braces'
  | 'Invisible Aligners'
  | 'Root Canal Treatment'
  | 'Removable Denture'
  | 'Cast Partial Denture'
  | 'E-Max'
  | 'Zirconia'
  | 'PFM'
  | 'Veneers'
  | 'Tooth Extraction'
  | 'Scaling & Polishing'
  | 'Filling'
  | 'Other'

export const APPOINTMENT_REASONS: AppointmentReason[] = [
  'Checkup',
  'Implant',
  'Braces',
  'Invisible Aligners',
  'Root Canal Treatment',
  'Removable Denture',
  'Cast Partial Denture',
  'E-Max',
  'Zirconia',
  'PFM',
  'Veneers',
  'Tooth Extraction',
  'Scaling & Polishing',
  'Filling',
  'Other',
]

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'PENDING',
  'CONTACTED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

export interface Appointment {
  id: number
  client_id: number | null
  patient_name: string
  contact_number: string
  address: string | null
  reason: string
  other_problem: string | null
  /** Multi-treatment list. When present, use instead of `reason` for display. Falls back to [reason] for legacy appointments. */
  treatments: string[] | null
  status: AppointmentStatus
  appointment_date: string | null
  appointment_time: string | null
  notes: string | null
  /** Total amount charged for this appointment (treatment cost) */
  total_amount: number | null
  /** Amount the patient has already paid */
  amount_paid: number | null
  /** Date when amount_paid was last recorded — used for monthly revenue bucketing */
  last_payment_date: string | null
  created_at: string
  updated_at: string
  /** Files attached to this appointment (x-rays, PDFs, etc.) */
  files: AppointmentFile[]
}

export interface AppointmentListItem {
  id: number
  client_id: number | null
  patient_name: string
  contact_number: string
  reason: string
  treatments: string[] | null
  status: AppointmentStatus
  appointment_date: string | null
  appointment_time: string | null
  total_amount: number | null
  amount_paid: number | null
  created_at: string
}

export interface PublicAppointmentCreate {
  patient_name: string
  contact_number: string
  address?: string
  reason: string
  other_problem?: string
}

export interface AppointmentCreate {
  client_id?: number
  patient_name: string
  contact_number: string
  address?: string
  reason: string
  other_problem?: string
  /** Optional list of treatments — overrides `reason` for display when set */
  treatments?: string[]
  status: AppointmentStatus
  appointment_date?: string
  appointment_time?: string
  notes?: string
  total_amount?: number | null
  amount_paid?: number | null
}

export interface AppointmentUpdate {
  client_id?: number | null
  patient_name?: string
  contact_number?: string
  address?: string
  reason?: string
  other_problem?: string
  /** Send updated list to change treatments; send [] to clear to single-reason mode */
  treatments?: string[]
  status?: AppointmentStatus
  appointment_date?: string | null
  appointment_time?: string | null
  notes?: string
  total_amount?: number | null
  amount_paid?: number | null
}

// ---- Client ----

export interface Client {
  id: number
  name: string
  contact_number: string
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientListItem {
  id: number
  name: string
  contact_number: string
  address: string | null
  created_at: string
}

export interface ClientCreate {
  name: string
  contact_number: string
  address?: string
  notes?: string
}

export interface ClientUpdate {
  name?: string
  contact_number?: string
  address?: string
  notes?: string
}

// ---- Service ----

export interface Service {
  id: number
  name: string
  slug: string
  short_description: string | null
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ServiceListItem {
  id: number
  name: string
  slug: string
  short_description: string | null
  image_url: string | null
  is_active: boolean
}

// ---- Testimonial ----

export interface Testimonial {
  id: number
  name: string
  content: string
  rating: number
  is_published: boolean
  created_at: string
  updated_at: string
}

// ---- Clinic ----

export interface ClinicInfo {
  name: string
  address: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  google_maps_url: string | null
  opening_hours: {
    monday_saturday: string
    sunday: string
  }
  social_facebook?: string | null
  social_instagram?: string | null
}

// ---- Monthly Payment Summaries ----

export interface MonthlyPaymentSummary {
  id: number
  year: number
  month: number
  client_id: number | null
  patient_name: string
  total_charged: number
  total_paid: number
  total_pending: number
  appointment_count: number
  snapshot_date: string
  created_at: string
}

export interface ClinicMonthlyTotals {
  year: number
  month: number
  month_label: string
  total_charged: number
  total_paid: number
  total_pending: number
  patient_count: number
  appointment_count: number
}

export interface CurrentMonthPayments {
  year: number
  month: number
  month_label: string
  total_charged: number
  total_paid: number
  total_pending: number
  patient_count: number
  appointment_count: number
}

export interface MonthlyHistoryResponse {
  current_month: CurrentMonthPayments
  archived_months: ClinicMonthlyTotals[]
}

export interface MonthlyRolloverResult {
  year: number
  month: number
  month_label: string
  patients_archived: number
  message: string
}

// ---- Dashboard ----

export interface PaymentLogEntry {
  appointment_id: number
  patient_name: string
  appointment_date: string | null
  reason: string
  total_amount: number | null
  amount_paid: number
  pending_amount: number | null
  status: AppointmentStatus
}

export interface DashboardStats {
  total_clients: number
  total_appointments: number
  /** @deprecated use all_time_paid instead */
  total_payments: number
  all_time_charged: number
  all_time_paid: number
  all_time_pending: number
  // Current month live snapshot
  current_month_year: number
  current_month_month: number
  current_month_label: string
  current_month_charged: number
  current_month_paid: number
  current_month_pending: number
  current_month_patients: number
  current_month_appointments: number
  // Appointment status counts
  pending_appointments: number
  contacted_appointments: number
  confirmed_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  // Today / upcoming
  today_appointments: Appointment[]
  upcoming_appointments: Appointment[]
  // Charts
  status_chart: { status: string; count: number }[]
  trend_chart: { date: string; count: number }[]
  // Archived monthly clinic-wide totals
  archived_months: ClinicMonthlyTotals[]
  // Current month payment log — one row per appointment with a payment
  current_month_payment_log: PaymentLogEntry[]
}

// ---- Auth ----

export interface AdminInfo {
  username: string
}
// ---- Employee ----

export interface Employee {
  id: number
  name: string
  contact_number: string | null
  role: string | null
  notes: string | null
  is_active: boolean
  total_paid: number
  payment_count: number
  created_at: string
  updated_at: string
}

export interface EmployeeListItem {
  id: number
  name: string
  contact_number: string | null
  role: string | null
  is_active: boolean
  total_paid: number
  payment_count: number
  created_at: string
}

export interface EmployeeOption {
  id: number
  name: string
  role: string | null
}

export interface EmployeeCreate {
  name: string
  contact_number?: string
  role?: string
  notes?: string
  is_active?: boolean
}

export interface EmployeeUpdate {
  name?: string
  contact_number?: string
  role?: string
  notes?: string
  is_active?: boolean
}

// ---- Employee Payment ----

export interface EmployeePayment {
  id: number
  employee_id: number
  employee_name: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EmployeePaymentListItem {
  id: number
  employee_id: number
  employee_name: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
}

export interface EmployeePaymentCreate {
  employee_id: number
  amount: number
  payment_date: string
  notes?: string
}

export interface EmployeePaymentUpdate {
  employee_id?: number
  amount?: number
  payment_date?: string
  notes?: string
}

export interface DailyTotal {
  date: string
  total: number
  count: number
}

export interface WeeklyTotal {
  week_start: string
  total: number
  count: number
}

export interface MonthlyTotal {
  year: number
  month: number
  total: number
  count: number
}

export interface EmployeeTotal {
  employee_id: number
  employee_name: string
  total: number
  count: number
}

export interface PaymentSummary {
  total_amount: number
  total_count: number
  employee_count: number
  daily_totals: DailyTotal[]
  weekly_totals: WeeklyTotal[]
  monthly_totals: MonthlyTotal[]
  employee_totals: EmployeeTotal[]
}

export interface EmployeeSummary {
  employee_id: number
  employee_name: string
  total_paid: number
  payment_count: number
  monthly_totals: MonthlyTotal[]
}

// ---- Laboratory ----

export interface Laboratory {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LaboratoryListItem {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LaboratoryOption {
  id: number
  name: string
  is_active: boolean
}

export interface LaboratoryCreate {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  is_active?: boolean
}

export interface LaboratoryUpdate {
  name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  is_active?: boolean
}

// ---- Lab Work ----

export type LabWorkType = 'PFM' | '3D PFM' | 'Zirconia' | 'E-Max' | 'Dentures' | 'Aligner' | 'Inlay' | 'CC Plate' | 'Other'

export const LAB_WORK_TYPES: LabWorkType[] = ['PFM', '3D PFM', 'Zirconia', 'E-Max', 'Dentures', 'Aligner', 'Inlay', 'CC Plate', 'Other']

export type LabWorkStatus = 'Pending' | 'In Progress' | 'Completed'

export const LAB_WORK_STATUSES: LabWorkStatus[] = ['Pending', 'In Progress', 'Completed']

export interface LabWork {
  id: number
  patient_name: string
  client_id: number | null
  laboratory_id: number | null
  laboratory_name: string | null
  work_type: LabWorkType
  teeth: string[]
  status: LabWorkStatus
  work_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LabWorkListItem {
  id: number
  patient_name: string
  laboratory_id: number | null
  laboratory_name: string | null
  work_type: LabWorkType
  teeth: string[]
  status: LabWorkStatus
  work_date: string
  created_at: string
}

export interface LabWorkCreate {
  patient_name: string
  client_id?: number | null
  laboratory_id?: number | null
  work_type: LabWorkType
  teeth: string[]
  status: LabWorkStatus
  work_date: string
  notes?: string
}

export interface LabWorkUpdate {
  patient_name?: string
  client_id?: number | null
  laboratory_id?: number | null
  work_type?: LabWorkType
  teeth?: string[]
  status?: LabWorkStatus
  work_date?: string
  notes?: string
}

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
  status: AppointmentStatus
  appointment_date: string | null
  appointment_time: string | null
  notes: string | null
  /** Total amount charged for this appointment (treatment cost) */
  total_amount: number | null
  /** Amount the patient has already paid */
  amount_paid: number | null
  created_at: string
  updated_at: string
}

export interface AppointmentListItem {
  id: number
  client_id: number | null
  patient_name: string
  contact_number: string
  reason: string
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
}

// ---- Auth ----

export interface AdminInfo {
  username: string
}

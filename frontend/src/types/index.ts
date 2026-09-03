// ---- API Response types ----

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T | null
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

// ---- Dashboard ----

export interface DashboardStats {
  total_clients: number
  total_appointments: number
  pending_appointments: number
  contacted_appointments: number
  confirmed_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  today_appointments: Appointment[]
  upcoming_appointments: Appointment[]
  status_chart: { status: string; count: number }[]
  trend_chart: { date: string; count: number }[]
}

// ---- Auth ----

export interface AdminInfo {
  username: string
}

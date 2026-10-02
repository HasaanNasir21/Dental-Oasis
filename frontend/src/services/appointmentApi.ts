import apiClient from './apiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  Appointment,
  AppointmentListItem,
  PublicAppointmentCreate,
  AppointmentCreate,
  AppointmentUpdate,
} from '../types'

export const appointmentApi = {
  // Public
  createPublic: async (data: PublicAppointmentCreate): Promise<ApiResponse<Appointment>> => {
    const res = await apiClient.post('/api/appointments', data)
    return res.data
  },

  // Admin
  list: async (params: {
    page?: number
    page_size?: number
    status?: string
    reason?: string
    search?: string
    date_from?: string
    date_to?: string
  }): Promise<PaginatedResponse<AppointmentListItem>> => {
    const res = await apiClient.get('/api/admin/appointments', { params })
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<Appointment>> => {
    const res = await apiClient.get(`/api/admin/appointments/${id}`)
    return res.data
  },

  create: async (data: AppointmentCreate): Promise<ApiResponse<Appointment>> => {
    const res = await apiClient.post('/api/admin/appointments', data)
    return res.data
  },

  update: async (id: number, data: AppointmentUpdate): Promise<ApiResponse<Appointment>> => {
    const res = await apiClient.patch(`/api/admin/appointments/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(`/api/admin/appointments/${id}`)
    return res.data
  },

  getCalendar: async (start_date: string, end_date: string): Promise<ApiResponse<Appointment[]>> => {
    const res = await apiClient.get('/api/admin/calendar', { params: { start_date, end_date } })
    return res.data
  },

  /**
   * Fetch available time slots for the given date.
   * Returns HH:MM strings for slots not yet taken by CONTACTED/CONFIRMED appointments.
   * Pass excludeId when editing an existing appointment so its own slot stays available.
   */
  getAvailableSlots: async (date: string, excludeId?: number): Promise<ApiResponse<string[]>> => {
    const res = await apiClient.get('/api/admin/appointments/available-slots', {
      params: { date, ...(excludeId !== undefined ? { exclude_id: excludeId } : {}) },
    })
    return res.data
  },
}

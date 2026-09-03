import apiClient from './apiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  Appointment,
  AppointmentListItem,
  PublicAppointmentCreate,
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
}

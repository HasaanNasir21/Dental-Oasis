import apiClient from './apiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  Client,
  ClientListItem,
  ClientCreate,
  ClientUpdate,
  Appointment,
  AppointmentCreate,
} from '../types'

export const clientApi = {
  list: async (params: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<PaginatedResponse<ClientListItem>> => {
    const res = await apiClient.get('/api/admin/clients', { params })
    return res.data
  },

  create: async (data: ClientCreate): Promise<ApiResponse<Client>> => {
    const res = await apiClient.post('/api/admin/clients', data)
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<Client>> => {
    const res = await apiClient.get(`/api/admin/clients/${id}`)
    return res.data
  },

  update: async (id: number, data: ClientUpdate): Promise<ApiResponse<Client>> => {
    const res = await apiClient.patch(`/api/admin/clients/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(`/api/admin/clients/${id}`)
    return res.data
  },

  getAppointments: async (id: number): Promise<ApiResponse<Appointment[]>> => {
    const res = await apiClient.get(`/api/admin/clients/${id}/appointments`)
    return res.data
  },

  createAppointment: async (clientId: number, data: AppointmentCreate): Promise<ApiResponse<Appointment>> => {
    const res = await apiClient.post(`/api/admin/clients/${clientId}/appointments`, data)
    return res.data
  },
}

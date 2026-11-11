import apiClient from './apiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  LabWork,
  LabWorkListItem,
  LabWorkCreate,
  LabWorkUpdate,
} from '../types'

export const labWorkApi = {
  list: async (params: {
    page?: number
    page_size?: number
    search?: string
    work_type?: string
    status?: string
    from_date?: string
    to_date?: string
  }): Promise<PaginatedResponse<LabWorkListItem>> => {
    const res = await apiClient.get('/api/admin/lab-work', { params })
    return res.data
  },

  create: async (data: LabWorkCreate): Promise<ApiResponse<LabWork>> => {
    const res = await apiClient.post('/api/admin/lab-work', data)
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<LabWork>> => {
    const res = await apiClient.get(`/api/admin/lab-work/${id}`)
    return res.data
  },

  update: async (id: number, data: LabWorkUpdate): Promise<ApiResponse<LabWork>> => {
    const res = await apiClient.patch(`/api/admin/lab-work/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(`/api/admin/lab-work/${id}`)
    return res.data
  },
}

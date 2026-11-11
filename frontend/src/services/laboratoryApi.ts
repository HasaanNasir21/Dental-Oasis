import apiClient from './apiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  Laboratory,
  LaboratoryListItem,
  LaboratoryCreate,
  LaboratoryUpdate,
  LaboratoryOption,
} from '../types'

export const laboratoryApi = {
  list: async (params: {
    page?: number
    page_size?: number
    search?: string
    is_active?: boolean
  }): Promise<PaginatedResponse<LaboratoryListItem>> => {
    const res = await apiClient.get('/api/admin/laboratories', { params })
    return res.data
  },

  options: async (): Promise<ApiResponse<LaboratoryOption[]>> => {
    const res = await apiClient.get('/api/admin/laboratories/options')
    return res.data
  },

  create: async (data: LaboratoryCreate): Promise<ApiResponse<Laboratory>> => {
    const res = await apiClient.post('/api/admin/laboratories', data)
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<Laboratory>> => {
    const res = await apiClient.get(`/api/admin/laboratories/${id}`)
    return res.data
  },

  update: async (id: number, data: LaboratoryUpdate): Promise<ApiResponse<Laboratory>> => {
    const res = await apiClient.patch(`/api/admin/laboratories/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(`/api/admin/laboratories/${id}`)
    return res.data
  },
}

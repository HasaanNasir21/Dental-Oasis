import apiClient from './apiClient'
import type { ApiResponse, Service, ServiceListItem } from '../types'

export const serviceApi = {
  list: async (): Promise<ApiResponse<ServiceListItem[]>> => {
    const res = await apiClient.get('/api/services')
    return res.data
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Service>> => {
    const res = await apiClient.get(`/api/services/${slug}`)
    return res.data
  },
}
